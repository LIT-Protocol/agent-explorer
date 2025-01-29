/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { providers } from "ethers";
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
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { Admin, type LitNetwork } from "@lit-protocol/agent-wallet";

interface AgentDetails {
    owner: string;
    delegatees: string[];
    toolsWithPolicies: Record<string, ToolData>;
    allTools: string[];
}

interface ToolInfo {
    toolIpfsCid: string;
    delegatees: string[];
    delegateesPolicyIpfsCids: string[];
    delegateesPolicyEnabled: boolean[];
}

interface ToolData {
    toolEnabled: boolean;
    delegateePolicies: Record<string, { policyEnabled: boolean }>;
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
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const signer = React.useMemo(
        () =>
            walletClient
                ? new providers.Web3Provider(walletClient as any).getSigner()
                : undefined,
        [walletClient]
    );

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
        console.log("fetching agent details...");

        setIsLoading(true);
        setAgentDetails(null);
        setError("");

        try {
            const sdk = await Admin.create(
                {
                    type: "eoa",
                    privateKey:
                        "d653763be1854048e1a70dd9fc94d47c09c790fb1530a01ee65257b0b698c352",
                },
                {
                    // @ts-ignore
                    litNetwork: network,
                    storage: {
                        prefix: "lit-agent-wallet", // prefix for keys in localStorage
                        ephemeral: false, // persist data between page reloads
                    },
                }
            );

            if (!signer || !address) {
                setError("Please connect your wallet first");
                return;
            }

            const pkpId = await sdk.getTokenIdByPkpEthAddress(walletAddress);
            console.log("pkpId", pkpId);

            if (pkpId.isZero()) {
                throw new Error(
                    "The Agent's Authenticity couldn't be verified"
                );
            }

            const allToolsInfo =
                await sdk.getRegisteredToolsAndDelegateesForPkp(pkpId);
            console.log("getRegisteredToolsAndDelegateesForPkp", allToolsInfo);

            const delegatees = await sdk.getDelegatees(pkpId);
            console.log("delegatees", delegatees);

            const permittedActions = await sdk.getPermittedActions(pkpId);
            console.log("permittedActions", permittedActions);

            function findToolsWithPolicies(data: any) {
                const toolsWithPolicies = {
                    ...data.toolsWithPolicies,
                    ...data.toolsUnknownWithPolicies,
                };
                return toolsWithPolicies;
            }

            function findAllTools(data: any) {
                const allTools = new Set([
                    ...Object.keys(data.toolsWithPolicies),
                    ...Object.keys(data.toolsWithoutPolicies),
                    ...Object.keys(data.toolsUnknownWithPolicies),
                    ...data.toolsUnknownWithoutPolicies,
                ]);
                return [...allTools];
            }

            function showEnabledPolicies(data: any) {
                const enabledPolicies: any = {};

                for (const [toolId, toolData] of Object.entries(
                    data.toolsUnknownWithPolicies as Record<string, ToolData>
                )) {
                    if (toolData.toolEnabled) {
                        const enabledDelegatees = Object.entries(
                            toolData.delegateePolicies
                        )
                            .filter(([_, policy]) => policy.policyEnabled)
                            .map(([delegatee]) => delegatee);

                        if (enabledDelegatees.length > 0) {
                            enabledPolicies[toolId] = {
                                enabledDelegatees,
                                policies: toolData.delegateePolicies,
                            };
                        }
                    }
                }
                return enabledPolicies;
            }

            // Execute the functions
            const toolsWithPolicies = findToolsWithPolicies(allToolsInfo);
            const allTools = findAllTools(allToolsInfo);
            const enabledPolicies = showEnabledPolicies(allToolsInfo);
            console.log("enabledPolicies", enabledPolicies);
            console.log("allTools", allTools);
            console.log("toolsWithPolicies", toolsWithPolicies);

            const owner = await sdk.getPKPOwner(pkpId);
            console.log("owner", owner);
            setAgentDetails({
                owner,
                delegatees,
                toolsWithPolicies,
                allTools,
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
                            <CardTitle>Owner Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono bg-gray-50 p-4 rounded-md break-all">
                                {agentDetails?.owner || "No owner found"}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Delegatees</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {agentDetails?.delegatees?.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1">
                                        {agentDetails.delegatees.map(
                                            (delegatee, idx) => (
                                                <li
                                                    key={idx}
                                                    className="font-mono text-sm break-all"
                                                >
                                                    {delegatee}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        No delegatees found
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Registered Tools</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {agentDetails?.allTools?.length > 0 ? (
                                    <div className="space-y-2">
                                        {agentDetails.allTools.map(
                                            (tool, idx) => (
                                                <button
                                                    key={idx}
                                                    className="font-mono text-sm break-all bg-gray-50 p-2 rounded w-full text-left flex justify-between items-center"
                                                    onClick={() =>
                                                        router.push(
                                                            `/ipfs/${tool}`
                                                        )
                                                    }
                                                >
                                                    {tool}
                                                    <span className="ml-2">
                                                        →
                                                    </span>
                                                </button>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        No tools found
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tools & Policies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {agentDetails?.toolsWithPolicies &&
                                    Object.entries(
                                        agentDetails.toolsWithPolicies
                                    ).map(
                                        ([
                                            toolId,
                                            toolData,
                                        ]): React.ReactElement => (
                                            <div
                                                key={toolId}
                                                className="border rounded-lg p-4"
                                            >
                                                <label className="text-sm text-gray-600 block mb-1">
                                                    IPFS CID:
                                                </label>
                                                <button
                                                    className="font-mono text-sm break-all bg-gray-50 p-2 rounded w-full text-left flex justify-between items-center mb-3"
                                                    onClick={() =>
                                                        router.push(
                                                            `/ipfs/${toolId}`
                                                        )
                                                    }
                                                >
                                                    {toolId}
                                                    <span className="ml-2">
                                                        →
                                                    </span>
                                                </button>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-sm text-gray-600 block mb-1">
                                                            Tool Enabled:
                                                        </label>
                                                        <div className="bg-gray-50 p-2 rounded">
                                                            {toolData?.toolEnabled
                                                                ? "Yes"
                                                                : "No"}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm text-gray-600 block mb-1">
                                                            Delegatee Policies:
                                                        </label>
                                                        <div className="bg-gray-50 p-2 rounded">
                                                            {toolData?.delegateePolicies &&
                                                                Object.entries(
                                                                    toolData.delegateePolicies
                                                                ).map(
                                                                    ([
                                                                        delegatee,
                                                                        policy,
                                                                    ]) => (
                                                                        <div
                                                                            key={delegatee}
                                                                            className="py-1 font-mono text-sm"
                                                                        >
                                                                            {delegatee}: {policy?.policyEnabled ? "Enabled" : "Disabled"}
                                                                        </div>
                                                                    )
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
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
