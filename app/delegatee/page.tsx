/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Header } from "@/app/components/Header";
import { useState } from "react";
import { PkpToolRegistryContract } from "@lit-protocol/agent-wallet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types"

export default function DelegateePage() {
    const router = useRouter();
    const [network, setNetwork] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("selectedNetwork") || "datil-dev";
        }
        return "datil-dev";
    });
    const [delegateeDetails, setDelegateeDetails] = useState<any>(null);
    const [permittedTools, setPermittedTools] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [delegateeAddress, setDelegateeAddress] = useState("");

    const fetchDelegateePKPs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            const details = await pkpToolRegistryContract.getDelegatedPkps(delegateeAddress);
            console.log("details", details);
            
            // Create a new array to store PKPs with their tools
            const pkpsWithTools = await Promise.all(details.map(async (pkp) => {
                const toolsResponse = await pkpToolRegistryContract.getPermittedToolsForPkp(pkp.tokenId, delegateeAddress);
                console.log("toolsResponse", toolsResponse);
                const tools = [];
                
                // Process all tool categories
                const categories = [
                    toolsResponse.toolsWithPolicies,
                    toolsResponse.toolsWithoutPolicies,
                    toolsResponse.toolsUnknownWithPolicies,
                    toolsResponse.toolsUnknownWithoutPolicies
                ];
                
                for (const category of categories) {
                    if (Array.isArray(category)) {
                        for (const tool of category) {
                            if (tool.toolIpfsCid) {
                                tools.push(tool.toolIpfsCid);
                            }
                        }
                    }
                }
                
                return {
                    ...pkp,
                    permittedTools: tools
                };
            }));
            
            console.log("pkpsWithTools", pkpsWithTools);
            setDelegateeDetails(pkpsWithTools);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto p-8">
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
                        <CardTitle>Delegatee Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                className="md:col-span-3"
                                placeholder="Enter Delegatee Address"
                                value={delegateeAddress}
                                onChange={(e) => setDelegateeAddress(e.target.value)}
                            />
                            <Button
                                onClick={fetchDelegateePKPs}
                                disabled={isLoading || !delegateeAddress}
                                variant="secondary"
                                className="w-full"
                            >
                                {isLoading ? "Fetching..." : "Fetch Delegations"}
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
                                {delegateeDetails.map((pkp: any, index: number) => (
                                    <div
                                        key={index}
                                        className="space-y-2 bg-gray-50 p-4 rounded"
                                    >
                                        <div>
                                            <span className="text-sm">PKP: </span>
                                            <code className="font-mono text-sm">
                                                {pkp.ethAddress}
                                            </code>
                                        </div>
                                        {pkp.permittedTools && pkp.permittedTools.length > 0 && (
                                            <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                                <h4 className="text-sm font-semibold mb-1">Permitted Tools (CID):</h4>
                                                {pkp.permittedTools.map((tool: any, toolIndex: number) => (
                                                    <button
                                                        key={toolIndex}
                                                        onClick={() => router.push(`/ipfs/${tool}`)}
                                                        className="w-full text-left font-mono text-sm break-all bg-gray-100 p-2 rounded mb-2 flex justify-between items-center hover:bg-gray-200"
                                                    >
                                                        {tool}
                                                        <span className="ml-2">→</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
} 

// 0x291B0E3aA139b2bC9Ebd92168575b5c6bAD5236C