/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import bs58 from "bs58";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import WalletConnect from "@/components/ui/login";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getNetworkConfig,
    PROVIDER_URL,
    PKP_PERMISSIONS_ABI,
    PUBKEY_ROUTER_ABI,
    PKP_TOOL_POLICY_REGISTRY_ABI,
    PKP_NFT_ABI,
} from "./config";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface AgentDetails {
    admin: string;
    policies: {
        toolName: string;
        ipfsCid: string;
        delegatees: string[];
        encodedPolicy: string;
        decodedPolicy?: {
            decodedPolicy: Record<string, string | number | boolean>;
            version: string;
        };
    }[];
    permittedActions: string[];
}

const NetworkSelector = ({
    value,
    onValueChange,
}: {
    value: string;
    onValueChange: (value: string) => void;
}) => {
    const networks = [
        { id: "datil-dev", name: "DatilDev" },
        { id: "datil-test", name: "DatilTest" },
        { id: "datil", name: "Datil" },
    ];

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-32">
                <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {networks.map((network) => (
                        <SelectItem
                            key={network.id}
                            value={network.id}
                            className="flex items-center gap-2"
                        >
                            <div className="flex items-center gap-2">
                                <Flame className="h-4 w-4" />
                                <span>{network.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};

const AgentSecurityChecker = () => {
    const [network, setNetwork] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("selectedNetwork") || "datil-dev";
        }
        return "datil-dev";
    });
    const [walletAddress, setWalletAddress] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("lastWalletAddress") || "";
        }
        return "";
    });
    const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(
        () => {
            if (typeof window !== "undefined") {
                const saved = localStorage.getItem("lastAgentDetails");
                return saved ? JSON.parse(saved) : null;
            }
            return null;
        }
    );
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (walletAddress) {
            localStorage.setItem("lastWalletAddress", walletAddress);
        }
    }, [walletAddress]);

    useEffect(() => {
        if (agentDetails) {
            localStorage.setItem(
                "lastAgentDetails",
                JSON.stringify(agentDetails)
            );
        }
    }, [agentDetails]);

    useEffect(() => {
        if (error) {
            localStorage.removeItem("lastAgentDetails");
        }
    }, [error]);

    useEffect(() => {
        if (network) {
            localStorage.setItem("selectedNetwork", network);
        }
    }, [network]);

    if (!mounted) {
        return null;
    }

    const fetchAgentDetails = async () => {
        const bytesToString = async (_bytes: string) => {
            const hexString = _bytes.startsWith("0x")
                ? _bytes.slice(2)
                : _bytes;
            const buffer = Buffer.from(hexString, "hex");
            const string = bs58.encode(buffer);
            return string;
        };

        try {
            setIsLoading(true);
            setAgentDetails(null);
            setError("");

            const networkConfig = getNetworkConfig(network);

            const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);

            const pubkeyRouterContract = new ethers.Contract(
                networkConfig.PUBKEY_ROUTER,
                PUBKEY_ROUTER_ABI,
                provider
            );

            const pkpId = await pubkeyRouterContract.ethAddressToPkpId(
                walletAddress
            );

            if (pkpId.isZero()) {
                throw new Error(
                    "The Agent's Authenticity couldn't be verified"
                );
            }

            const pkpPermissionsContract = new ethers.Contract(
                networkConfig.PKP_PERMISSIONS,
                PKP_PERMISSIONS_ABI,
                provider
            );

            const authMethods =
                await pkpPermissionsContract.getPermittedActions(pkpId);

            const permittedActions = await Promise.all(
                authMethods.map((method: string) => bytesToString(method))
            );

            const policyRegistryContract = new ethers.Contract(
                networkConfig.PKP_TOOL_POLICY_REGISTRY,
                PKP_TOOL_POLICY_REGISTRY_ABI,
                provider
            );

            const registeredTools =
                await policyRegistryContract.getRegisteredTools(pkpId);

            const delegatees = await policyRegistryContract.getDelegatees(
                pkpId
            );

            interface DecodedValue {
                [key: string]: any; // Can be any type since policy structure is dynamic
            }

            const extractPolicyStructure = (actionCode: string): string => {
                // Look for tuple definition in the policy validation section
                const policyMatch = actionCode.match(
                    /const\s+decodedPolicy\s*=\s*ethers\.utils\.defaultAbiCoder\.decode\(\s*\[\s*"([^"]+)"\s*\]/
                );

                if (!policyMatch) {
                    throw new Error(
                        "Could not find policy structure in action code"
                    );
                }

                return policyMatch[1];
            };

            async function decodePolicy(
                encodedPolicy: string,
                ipfsCid: string
            ): Promise<{
                decodedPolicy: DecodedValue | null;
                error?: string;
                version?: string; // Add version to return type
            }> {
                console.log(`Decoding policy for IPFS CID: ${ipfsCid}`);
                console.log("Encoded policy:", encodedPolicy);

                try {
                    // 1. Fetch the Lit Action code from IPFS
                    const response = await fetch(
                        `https://ipfs.io/ipfs/${ipfsCid}`
                    );
                    if (!response.ok) {
                        throw new Error(
                            `Failed to fetch Lit Action code: ${response.status}`
                        );
                    }

                    const actionCode = await response.text();

                    // 2. Extract the policy structure
                    const policyStructure = extractPolicyStructure(actionCode);
                    console.log("Extracted policy structure:", policyStructure);

                    // 3. Create ABI coder and decode
                    const abiCoder = new ethers.utils.AbiCoder();
                    const [decodedData] = abiCoder.decode(
                        [policyStructure],
                        ethers.utils.arrayify(encodedPolicy)
                    );

                    // 4. Format the decoded policy - handle any structure
                    const formatValue = (value: any): any => {
                        if (Array.isArray(value)) {
                            return value.map((v) => formatValue(v));
                        }
                        if (ethers.BigNumber.isBigNumber(value)) {
                            return value; // Keep as BigNumber for precise handling
                        }
                        if (
                            typeof value === "string" &&
                            value.startsWith("0x")
                        ) {
                            try {
                                return ethers.utils.getAddress(value); // Normalize addresses
                            } catch {
                                return value; // Not an address, keep as is
                            }
                        }
                        return value;
                    };

                    const formattedPolicy = Object.keys(decodedData).reduce(
                        (acc, key) => {
                            acc[key] = formatValue(decodedData[key]);
                            return acc;
                        },
                        {} as DecodedValue
                    );

                    console.log(
                        "Decoded policy:",
                        JSON.stringify(
                            formattedPolicy,
                            (_, value) =>
                                ethers.BigNumber.isBigNumber(value)
                                    ? value.toString()
                                    : value,
                            2
                        )
                    );

                    return {
                        decodedPolicy: formattedPolicy,
                        version: decodedData.version || "1.0", // Add default version if not present
                    };
                } catch (error) {
                    console.error("Error in decodePolicy:", error);
                    return {
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                        decodedPolicy: null,
                    };
                }
            }

            const policies = await Promise.all(
                registeredTools.ipfsCids.map(
                    async (cid: string, index: number) => {
                        const toolPolicy =
                            await policyRegistryContract.getToolPolicy(
                                pkpId,
                                cid
                            );

                        const encodedPolicy = ethers.utils.hexlify(
                            toolPolicy.policy
                        );
                        const decodedPolicy = decodePolicy(
                            toolPolicy.policy,
                            cid
                        );

                        return {
                            toolName: `Tool ${index + 1}`,
                            ipfsCid: cid,
                            delegatees: delegatees,
                            encodedPolicy,
                            decodedPolicy: {
                                decodedPolicy,
                                version: toolPolicy.version,
                            },
                        };
                    }
                )
            );

            const contractPKPNFT = new ethers.Contract(
                networkConfig.PKP_NFT,
                PKP_NFT_ABI,
                provider
            );
            const admin = await contractPKPNFT.ownerOf(pkpId);

            setAgentDetails({
                admin,
                policies,
                permittedActions,
            });
        } catch (err) {
            console.error("Error fetching agent details:", err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("The Agent's Authenticity couldn't be verified");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="relative mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">
                        Agent Security Checker
                    </h1>
                    <div className="flex items-center gap-4">
                        <NetworkSelector
                            value={network}
                            onValueChange={setNetwork}
                        />
                        <ConnectButton
                            accountStatus="address"
                            chainStatus="icon"
                            showBalance={false}
                        />
                        {/* <WalletConnect /> */}
                    </div>
                </div>
                <p className="text-gray-600 mb-6">
                    Verify the security configuration and policies of any agent
                    by entering their wallet address.
                </p>

                <div className="flex gap-3 mb-4">
                    <Input
                        className="flex-1"
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Enter Agent's Wallet Address"
                    />
                    <Button onClick={fetchAgentDetails} disabled={isLoading}>
                        {isLoading ? "Checking..." : "Check Security"}
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Verification Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {agentDetails && (
                <div className="space-y-6">
                    <Alert className="bg-green-50 border-green-200">
                        <Shield className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">
                            Verified PKP Agent
                        </AlertTitle>
                        <AlertDescription className="text-green-700">
                            This agent&apos;s authenticity has been verified
                            through PKP.
                        </AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono bg-gray-50 p-4 rounded-md break-all">
                                {agentDetails.admin}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Registered Tools & Policies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {agentDetails.policies.map((policy, index) => (
                                    <div
                                        key={index}
                                        className="border rounded-lg p-4"
                                    >
                                        <h3 className="font-semibold mb-3">
                                            {policy.toolName}
                                        </h3>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm text-gray-600 block mb-1">
                                                    IPFS CID:
                                                </label>
                                                <button
                                                    onClick={() =>
                                                        router.push(
                                                            `/ipfs/${policy.ipfsCid}`
                                                        )
                                                    }
                                                    className="block bg-gray-50 p-2 rounded text-sm break-all w-full text-left font-mono flex justify-between items-center"
                                                >
                                                    {policy.ipfsCid}
                                                    <span className="ml-2">
                                                        →
                                                    </span>
                                                </button>
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-600 block mb-1">
                                                    Delegatees:
                                                </label>
                                                <div className="bg-gray-50 p-2 rounded">
                                                    {policy.delegatees.length >
                                                    0 ? (
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {policy.delegatees.map(
                                                                (
                                                                    delegatee,
                                                                    idx
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="font-mono text-sm break-all"
                                                                    >
                                                                        {
                                                                            delegatee
                                                                        }
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-gray-500 text-sm">
                                                            No delegatees
                                                            specified
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-600 block mb-1">
                                                    Encoded Policy:
                                                </label>
                                                <code className="block bg-gray-50 p-2 rounded text-sm break-all">
                                                    {policy.encodedPolicy}
                                                </code>
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-600 block mb-1">
                                                    Decoded Policy:
                                                </label>
                                                <div className="bg-gray-50 p-2 rounded text-sm break-all font-mono">
                                                    {policy.decodedPolicy
                                                        ?.decodedPolicy ? (
                                                        <>
                                                            {Object.entries(
                                                                policy
                                                                    .decodedPolicy
                                                                    .decodedPolicy
                                                            ).map(
                                                                ([
                                                                    key,
                                                                    value,
                                                                ]) => {
                                                                    if (
                                                                        !isNaN(
                                                                            Number(
                                                                                key
                                                                            )
                                                                        ) ||
                                                                        value ==
                                                                            null
                                                                    )
                                                                        return null;

                                                                    let displayValue =
                                                                        "";

                                                                    if (
                                                                        Array.isArray(
                                                                            value
                                                                        )
                                                                    ) {
                                                                        displayValue =
                                                                            value.length >
                                                                            0
                                                                                ? value.join(
                                                                                      ", "
                                                                                  )
                                                                                : "None";
                                                                    } else if (
                                                                        typeof value ===
                                                                            "object" &&
                                                                        value !==
                                                                            null
                                                                    ) {
                                                                        if (
                                                                            "hex" in
                                                                            value
                                                                        ) {
                                                                            displayValue =
                                                                                ethers.BigNumber.from(
                                                                                    value.hex
                                                                                ).toString();
                                                                        } else {
                                                                            displayValue =
                                                                                JSON.stringify(
                                                                                    value
                                                                                );
                                                                        }
                                                                    } else {
                                                                        displayValue =
                                                                            String(
                                                                                value
                                                                            );
                                                                    }

                                                                    if (
                                                                        displayValue
                                                                    ) {
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    key
                                                                                }
                                                                                className="py-1"
                                                                            >
                                                                                <span className="font-medium">
                                                                                    {key
                                                                                        .replace(
                                                                                            /([A-Z])/g,
                                                                                            " $1"
                                                                                        )
                                                                                        .replace(
                                                                                            /^./,
                                                                                            (
                                                                                                str
                                                                                            ) =>
                                                                                                str.toUpperCase()
                                                                                        )}
                                                                                </span>

                                                                                :{" "}
                                                                                <span className="font-mono">
                                                                                    {
                                                                                        displayValue
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                }
                                                            )}
                                                            {policy
                                                                .decodedPolicy
                                                                .version && (
                                                                <div className="mt-2 text-gray-500">
                                                                    Version:{" "}
                                                                    {
                                                                        policy
                                                                            .decodedPolicy
                                                                            .version
                                                                    }
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p className="text-gray-500">
                                                            {policy
                                                                .decodedPolicy
                                                                ?.error ||
                                                                "Unable to decode policy"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {agentDetails.policies.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">
                                        No tools or policies registered for this
                                        agent.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permitted Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {agentDetails.permittedActions.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-2">
                                        {agentDetails.permittedActions.map(
                                            (action, idx) => (
                                                <div key={idx}>
                                                    <button
                                                        className="font-mono text-sm break-all bg-gray-50 p-2 rounded w-full text-left flex justify-between items-center"
                                                        onClick={() =>
                                                            router.push(
                                                                `/ipfs/${action}`
                                                            )
                                                        }
                                                    >
                                                        {action}
                                                        <span className="ml-2">
                                                            →
                                                        </span>
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">
                                        No permitted actions found for this
                                        agent.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default dynamic(() => Promise.resolve(AgentSecurityChecker), {
    ssr: false,
});
