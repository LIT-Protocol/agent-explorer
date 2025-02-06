"use client";
import React from "react";
import { useEffect, useState } from "react";
import { Header } from "@/app/components/Header";
import { PkpToolRegistryContract } from "@lit-protocol/agent-wallet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types";

interface Props {
    params: {
        address: string;
    };
}

export default function DelegateePage({ params }: Props) {
    const [network, setNetwork] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("selectedNetwork") || "datil-dev";
        }
        return "datil-dev";
    });
    const [delegateeDetails, setDelegateeDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agentAddress, setAgentAddress] = useState<string>("");
    const [searchInput, setSearchInput] = useState("");
    const router = useRouter();
    const searchParams: { address: string } = React.use(params as any);

    useEffect(() => {
        if (searchParams.address) {
            setAgentAddress(searchParams.address);
            setSearchInput(searchParams.address);
        }
    }, [searchParams.address]);

    const fetchDelegateePKPs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log("network", network);
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            const details = await pkpToolRegistryContract.getDelegatedPkps(
                agentAddress
            );
            console.log("details", details);

            const pkpsWithTools = await Promise.all(
                details.map(async (pkp) => {
                    const toolsResponse =
                        await pkpToolRegistryContract.getPermittedToolsForPkp(
                            pkp.tokenId,
                            agentAddress
                        );
                    console.log("getPermittedToolsForPkp", toolsResponse);
                    const toolsWithPolicies = [];

                    const categories = [
                        toolsResponse.toolsWithPolicies,
                        toolsResponse.toolsWithoutPolicies,
                        toolsResponse.toolsUnknownWithPolicies,
                        toolsResponse.toolsUnknownWithoutPolicies,
                    ];

                    for (const category of categories) {
                        if (Array.isArray(category)) {
                            for (const tool of category) {
                                if (tool.toolIpfsCid) {
                                    // Get tool enabled status
                                    const { isEnabled: toolEnabled } =
                                        await pkpToolRegistryContract.isToolRegistered(
                                            pkp.tokenId,
                                            tool.toolIpfsCid
                                        );

                                    // Get policy information if available
                                    const policyInfo =
                                        await pkpToolRegistryContract
                                            .getToolPolicyForDelegatee(
                                                pkp.tokenId,
                                                tool.toolIpfsCid,
                                                agentAddress
                                            )
                                            .catch(() => null);

                                    toolsWithPolicies.push({
                                        toolIpfsCid: tool.toolIpfsCid,
                                        toolEnabled,
                                        policy: policyInfo
                                            ? {
                                                  policyIpfsCid:
                                                      policyInfo.policyIpfsCid,
                                                  policyEnabled:
                                                      policyInfo.enabled,
                                              }
                                            : null,
                                    });
                                }
                            }
                        }
                    }

                    return {
                        ...pkp,
                        permittedTools: toolsWithPolicies,
                    };
                })
            );

            console.log("pkpsWithTools", pkpsWithTools);
            setDelegateeDetails(pkpsWithTools);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (agentAddress) {
            fetchDelegateePKPs();
        }
    }, [agentAddress]);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Header network={network} setNetwork={setNetwork} />

            <div className="space-y-8">
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Delegatee</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-gray-600 mb-6">
                            Verify the the delegatee&apos;s permissions and
                            policies.
                        </p>
                        <div className="flex gap-3 mb-4">
                            <Input
                                className="flex-1"
                                type="text"
                                placeholder="Enter Delegatee's Wallet Address"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && searchInput) {
                                        router.push(
                                            `/delegatee/${searchInput}`
                                        );
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    if (searchInput) {
                                        router.push(
                                            `/delegatee/${searchInput}`
                                        );
                                    }
                                }}
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Fetching..."
                                    : "Fetch Permissions"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {delegateeDetails && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Delegations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {delegateeDetails.map(
                                    (pkp: any, index: number) => (
                                        <div
                                            key={index}
                                            className="space-y-2 bg-gray-50 p-4 rounded"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-sm">
                                                        PKP:
                                                    </span>
                                                    <code className="text-sm text-gray-600">
                                                        {pkp.ethAddress}
                                                    </code>
                                                </div>
                                            </div>

                                            {pkp.permittedTools &&
                                                pkp.permittedTools.length >
                                                    0 && (
                                                    <div className="mt-2 space-y-2">
                                                        {pkp.permittedTools.map(
                                                            (
                                                                tool: any,
                                                                toolIndex: number
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        toolIndex
                                                                    }
                                                                    className="bg-white p-2 rounded text-sm"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs text-gray-500">
                                                                                Tool:
                                                                            </span>
                                                                            <div className="flex items-center">
                                                                                <code className="text-xs text-gray-600">
                                                                                    {
                                                                                        tool.toolIpfsCid
                                                                                    }
                                                                                </code>
                                                                                <span
                                                                                    className={`text-xs ml-2 ${
                                                                                        tool.toolEnabled
                                                                                            ? "text-green-600"
                                                                                            : "text-gray-500"
                                                                                    }`}
                                                                                >
                                                                                    (
                                                                                    {tool.toolEnabled
                                                                                        ? "Enabled"
                                                                                        : "Disabled"}

                                                                                    )
                                                                                </span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="p-0 h-auto ml-1"
                                                                                    onClick={() =>
                                                                                        router.push(
                                                                                            `/ipfs/${tool.toolIpfsCid}`
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <ArrowUpRight className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {tool.policy ? (
                                                                        <div className="mt-1 flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs text-gray-500">
                                                                                    Policy:
                                                                                </span>
                                                                                <div className="flex items-center">
                                                                                    <code className="text-xs text-gray-600">
                                                                                        {
                                                                                            tool
                                                                                                .policy
                                                                                                .policyIpfsCid
                                                                                        }
                                                                                    </code>
                                                                                    <span
                                                                                        className={`text-xs ml-2 ${
                                                                                            tool
                                                                                                .policy
                                                                                                .policyEnabled
                                                                                                ? "text-green-600"
                                                                                                : "text-gray-500"
                                                                                        }`}
                                                                                    >
                                                                                        (
                                                                                        {tool
                                                                                            .policy
                                                                                            .policyEnabled
                                                                                            ? "Enabled"
                                                                                            : "Disabled"}

                                                                                        )
                                                                                    </span>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="p-0 h-auto ml-1"
                                                                                        onClick={() =>
                                                                                            router.push(
                                                                                                `/ipfs/${tool.policy.policyIpfsCid}`
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <ArrowUpRight className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="mt-1">
                                                                            <span className="text-xs text-gray-500">
                                                                                Policy:{" "}
                                                                            </span>
                                                                            <span className="text-xs text-gray-600">
                                                                                No
                                                                                Policy
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

// 0x291B0E3aA139b2bC9Ebd92168575b5c6bAD5236C
