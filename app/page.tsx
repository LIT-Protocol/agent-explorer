/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import { providers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { PkpToolRegistryContract } from "@lit-protocol/agent-wallet";
import { Header } from "@/app/components/Header";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types"

interface AgentDetails {
    owner: string;
    delegatees: string[];
    toolsWithPolicies: Record<string, ToolData>;
    allTools: string[];
}

interface ToolData {
    toolEnabled: boolean;
    delegateePolicies: Record<string, { policyEnabled: boolean }>;
    policyIpfsCid?: string;
}

const QueryPage = () => {
    const [network, setNetwork] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("selectedNetwork") || "datil-dev";
        }
        return "datil-dev";
    });

    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const signer = React.useMemo(
        () =>
            walletClient
                ? new providers.Web3Provider(walletClient as any).getSigner()
                : undefined,
        [walletClient]
    );

    const [walletAddress, setWalletAddress] = useState();
    const [agentDetails, setAgentDetails] = useState<AgentDetails | null>();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);


    if (!mounted) {
        return null;
    }

    const fetchAgentDetails = async () => {
        console.log("fetching agent details...");

        setIsLoading(true);
        setAgentDetails(null);
        setError("");

        try {
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            if (!signer || !address) {
                setError("Please connect your wallet first");
                return;
            }

            const pkpId = await pkpToolRegistryContract.getTokenIdByPkpEthAddress(walletAddress);
            console.log("pkpId", pkpId);

            if (pkpId.isZero()) {
                throw new Error(
                    "The Agent's Authenticity couldn't be verified"
                );
            }

            const allToolsInfo =
                await pkpToolRegistryContract.getRegisteredToolsAndDelegateesForPkp(pkpId);

            const delegatees = await pkpToolRegistryContract.getDelegatees(pkpId);

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

            const owner = await pkpToolRegistryContract.getPKPOwner(pkpId);
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

    function extractPolicyIpfsCids(data: any) {
        let policyIpfsCids;

        if (data.delegateePolicies) {
            Object.entries(data.delegateePolicies).forEach(
                ([, policy]: [string, any]) => {
                    if (policy.policyIpfsCid) {
                        policyIpfsCids = policy.policyIpfsCid;
                    }
                }
            );
        }
        return policyIpfsCids;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Header network={network} setNetwork={setNetwork} />
            {pathname === "/" && (
                <div>
                    <p className="text-gray-600 mb-6">
                        Verify the security configuration and policies of any
                        agent by entering their wallet address.
                    </p>

                    <div className="flex gap-3 mb-4">
                        <Input
                            className="flex-1"
                            type="text"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="Enter Agent's Wallet Address"
                        />
                        <Button
                            onClick={fetchAgentDetails}
                            disabled={isLoading}
                        >
                            {isLoading ? "Checking..." : "Check Security"}
                        </Button>
                    </div>
                </div>
            )}

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
                                                                            key={
                                                                                delegatee
                                                                            }
                                                                            className="py-1 font-mono text-sm"
                                                                        >
                                                                            {
                                                                                delegatee
                                                                            }
                                                                            :{" "}
                                                                            {policy?.policyEnabled
                                                                                ? "Enabled"
                                                                                : "Disabled"}
                                                                        </div>
                                                                    )
                                                                )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div>
                                                            <label className="text-sm text-gray-600 block mb-1">
                                                                Policy IPFS CID:
                                                            </label>
                                                            <button
                                                                className="font-mono text-sm break-all bg-gray-50 p-2 rounded w-full text-left flex justify-between items-center"
                                                                onClick={() => {
                                                                    const ipfsCid =
                                                                        extractPolicyIpfsCids(
                                                                            toolData
                                                                        );
                                                                    if (
                                                                        ipfsCid
                                                                    ) {
                                                                        router.push(
                                                                            `/ipfs/${ipfsCid}`
                                                                        );
                                                                    }
                                                                }}
                                                                disabled={
                                                                    !extractPolicyIpfsCids(
                                                                        toolData
                                                                    )
                                                                }
                                                            >
                                                                <span>
                                                                    {extractPolicyIpfsCids(
                                                                        toolData
                                                                    ) ||
                                                                        "No policy ID found"}
                                                                </span>
                                                                {extractPolicyIpfsCids(
                                                                    toolData
                                                                ) && (
                                                                    <span className="ml-2">
                                                                        →
                                                                    </span>
                                                                )}
                                                            </button>
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

export default QueryPage;

// export default dynamic(() => Promise.resolve(QueryPage), {
//     ssr: false,
// });
