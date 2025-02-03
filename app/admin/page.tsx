"use client";
import { Header } from "@/app/components/Header";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, Plus, Minus } from "lucide-react";
import {
    PkpToolRegistryContract,
} from "@lit-protocol/agent-wallet";
import { IPFS_CID_TO_ACTION_NAME } from "@/app/admin/config";
import React from "react";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types"
import { ethers } from "ethers"
    
export default function AdminPage() {
    const [network, setNetwork] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("selectedNetwork") || "datil-dev";
        }
        return "datil-dev";
    });

    const [loadingStates, setLoadingStates] = useState<{
        fetch: boolean;
        mint: boolean;
        addTool: boolean;
        addDelegatee: boolean;
        removeTool: Record<string, boolean>;
        removeDelegatee: Record<string, boolean>;
        toggleTool: Record<string, boolean>;
        addToolDelegatee: Record<string, boolean>;
    }>({
        fetch: false,
        mint: false,
        addTool: false,
        addDelegatee: false,
        removeTool: {},
        removeDelegatee: {},
        toggleTool: {},
        addToolDelegatee: {},
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [newTool, setNewTool] = useState("");
    const [newDelegatee, setNewDelegatee] = useState("");
    const [agentAddress, setAgentAddress] = useState("");

    const [delegatees, setDelegatees] = useState<string[]>([]);

    interface ToolMetadata {
        toolEnabled?: boolean;
        delegatees: string[];
    }

    interface ToolWithPolicies extends ToolMetadata {
        delegateePolicies: {
            [delegatee: string]: {
                policyIpfsCid: string;
                policyEnabled: boolean;
            };
        };
    }

    interface ToolsData {
        toolsWithPolicies: { [ipfsCid: string]: ToolWithPolicies };
        toolsWithoutPolicies: { [ipfsCid: string]: ToolMetadata };
        toolsUnknownWithPolicies: { [ipfsCid: string]: ToolWithPolicies };
        toolsUnknownWithoutPolicies: string[];
    }

    const [toolsData, setToolsData] = useState<ToolsData | null>(null);

    const [toolNames, setToolNames] = useState<Record<string, string>>({});

    // Add new state to track which tool's input field should be shown
    const [showDelegateeInput, setShowDelegateeInput] = useState<string | null>(
        null
    );
    const [newToolDelegatee, setNewToolDelegatee] = useState("");

    useEffect(() => {
        const tools = getAllTools();
        tools.forEach((cid) => {
            if (toolNames[cid]) return;

            if (
                IPFS_CID_TO_ACTION_NAME[
                    cid as keyof typeof IPFS_CID_TO_ACTION_NAME
                ]
            ) {
                setToolNames((prev) => ({
                    ...prev,
                    [cid]: IPFS_CID_TO_ACTION_NAME[
                        cid as keyof typeof IPFS_CID_TO_ACTION_NAME
                    ],
                }));
                return;
            }
        });
    }, [toolsData]);

    const setLoading = (
        operation: keyof typeof loadingStates,
        isLoading: boolean,
        itemId?: string
    ) => {
        setLoadingStates((prev) => {
            if (
                itemId &&
                (operation === "removeTool" || operation === "removeDelegatee")
            ) {
                return {
                    ...prev,
                    [operation]: {
                        ...prev[operation],
                        [itemId]: isLoading,
                    },
                };
            }
            return { ...prev, [operation]: isLoading };
        });
    };

    const fetchAgentDetails = async () => {
        setLoading("fetch", true);
        setError("");
        try {
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            console.log("pkpId", pkpId);

            const allToolsInfo =
                await pkpToolRegistryContract.getRegisteredToolsAndDelegateesForPkp(
                    pkpId
                );
            console.log("toolsData", allToolsInfo);

            // Check enabled status for each tool
            for (const toolCid of getAllTools()) {
                const { isEnabled } =
                    await pkpToolRegistryContract.isToolRegistered(
                        pkpId,
                        toolCid
                    );
                if (allToolsInfo.toolsUnknownWithPolicies[toolCid]) {
                    allToolsInfo.toolsUnknownWithPolicies[toolCid].toolEnabled =
                        isEnabled;
                }
            }

            const delegatees = await pkpToolRegistryContract.getDelegatees(
                pkpId
            );
            console.log("delegatees", delegatees);

            setToolsData(allToolsInfo);
            setDelegatees(Array.isArray(delegatees) ? delegatees : []);
        } catch (err) {
            setError("Failed to fetch agent details");
            console.error(err);
        } finally {
            setLoading("fetch", false);
        }
    };

    const getToolName = (cid: string) => {
        return toolNames[cid] || cid;
    };

    const mintAgentWallet = async () => {
        setLoading("mint", true);
        setError("");
        setSuccess("");
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS,
                signer
            });
            await pkpToolRegistryContract.connect();

            const response = await pkpToolRegistryContract.mintPkp();
            const pkp = response.info;
            console.log(pkp);
            
            // Set the newly minted address to the agentAddress state
            setAgentAddress(pkp.ethAddress);
            
            setSuccess(
                `Agent wallet minted successfully!\nPKP: ${pkp.ethAddress}`
            );
        } catch (err) {
            setError("Failed to mint agent wallet");
            console.error(err);
        } finally {
            setLoading("mint", false);
        }
    };

    const addTool = async (toolCid: string) => {
        setLoading("addTool", true);
        setError("");

        try {
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS
            });
            await pkpToolRegistryContract.connect();
            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            await pkpToolRegistryContract.registerTool(pkpId, toolCid);

            // Update toolsData state with the new tool
            setToolsData((prev) =>
                prev
                    ? {
                          ...prev,
                          toolsWithoutPolicies: {
                              ...prev.toolsWithoutPolicies,
                              [toolCid]: { delegatees: [] },
                          },
                      }
                    : null
            );

            setNewTool("");
            setSuccess("Tool added successfully");
        } catch (err) {
            setError("Failed to add tool");
            console.error(err);
        } finally {
            setLoading("addTool", false);
        }
    };

    const removeTool = async (toolCid: string) => {
        setLoading("removeTool", true, toolCid);
        setError("");
        try {
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            await pkpToolRegistryContract.removeTool(pkpId, toolCid);

            // Update toolsData state by removing the tool
            setToolsData((prev) => {
                if (!prev) return null;
                const newState = { ...prev };
                delete newState.toolsWithPolicies[toolCid];
                delete newState.toolsWithoutPolicies[toolCid];
                delete newState.toolsUnknownWithPolicies[toolCid];
                newState.toolsUnknownWithoutPolicies =
                    newState.toolsUnknownWithoutPolicies.filter(
                        (t) => t !== toolCid
                    );
                return newState;
            });

            setSuccess("Tool removed successfully");
        } catch (err) {
            setError("Failed to remove tool");
            console.error(err);
        } finally {
            setLoading("removeTool", false, toolCid);
        }
    };

    const addDelegatee = async (delegateeAddress: string) => {
        setLoading("addDelegatee", true);
        setError("");
        try {
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            await pkpToolRegistryContract.addDelegatee(pkpId, delegateeAddress);

            setDelegatees((prev) => [...prev, delegateeAddress]);
            setNewDelegatee("");
            setSuccess("Delegatee added successfully");
        } catch (err) {
            setError("Failed to add delegatee");
            console.error(err);
        } finally {
            setLoading("addDelegatee", false);
        }
    };

    const removeDelegatee = async (delegateeAddress: string) => {
        setLoading("removeDelegatee", true, delegateeAddress);
        setError("");
        try {
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            await pkpToolRegistryContract.removeDelegatee(
                pkpId,
                delegateeAddress
            );

            setDelegatees((prev) => prev.filter((d) => d !== delegateeAddress));

            // Update toolsData to remove delegatee from all tools
            setToolsData((prev) => {
                if (!prev) return null;
                const newState = { ...prev };
                Object.keys(newState.toolsWithPolicies).forEach((toolCid) => {
                    newState.toolsWithPolicies[toolCid].delegatees =
                        newState.toolsWithPolicies[toolCid].delegatees.filter(
                            (d) => d !== delegateeAddress
                        );
                });
                Object.keys(newState.toolsUnknownWithPolicies).forEach(
                    (toolCid) => {
                        newState.toolsUnknownWithPolicies[toolCid].delegatees =
                            newState.toolsUnknownWithPolicies[
                                toolCid
                            ].delegatees.filter((d) => d !== delegateeAddress);
                    }
                );
                return newState;
            });

            setSuccess("Delegatee removed successfully");
        } catch (err) {
            setError("Failed to remove delegatee");
            console.error(err);
        } finally {
            setLoading("removeDelegatee", false, delegateeAddress);
        }
    };

    const getAllTools = () => {
        if (!toolsData) return [];

        return [
            ...Object.keys(toolsData.toolsWithPolicies || {}),
            ...Object.keys(toolsData.toolsWithoutPolicies || {}),
            ...Object.keys(toolsData.toolsUnknownWithPolicies || {}),
            ...(toolsData.toolsUnknownWithoutPolicies || []),
        ];
    };

    const getDelegateesForTool = (toolCid: string) => {
        if (!toolsData) return [];

        const tool = toolsData.toolsUnknownWithPolicies[toolCid];
        return tool?.delegatees || [];
    };

    const toggleTool = async (toolCid: string, enable: boolean) => {
        setLoading("toggleTool", true, toolCid);
        setError("");
        try {
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            if (enable) {
                await pkpToolRegistryContract.enableTool(pkpId, toolCid);
            } else {
                await pkpToolRegistryContract.disableTool(pkpId, toolCid);
            }

            // Update toolsData state
            setToolsData((prev) => {
                if (!prev) return null;
                const newState = { ...prev };
                if (newState.toolsWithPolicies[toolCid]) {
                    newState.toolsWithPolicies[toolCid].toolEnabled = enable;
                }
                if (newState.toolsUnknownWithPolicies[toolCid]) {
                    newState.toolsUnknownWithPolicies[toolCid].toolEnabled =
                        enable;
                }
                return newState;
            });

            setSuccess(`Tool ${enable ? "enabled" : "disabled"} successfully`);
        } catch (err) {
            setError(`Failed to ${enable ? "enable" : "disable"} tool`);
            console.error(err);
        } finally {
            setLoading("toggleTool", false, toolCid);
        }
    };

    const addDelegateeTool = async (
        toolCid: string,
        delegateeAddress: string
    ) => {
        setLoading("addToolDelegatee", true, toolCid);
        setError("");
        try {
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            await pkpToolRegistryContract.permitToolForDelegatee(
                pkpId,
                toolCid,
                delegateeAddress
            );

            // Update toolsData state
            setToolsData((prev) => {
                if (!prev) return null;
                const newState = { ...prev };
                if (newState.toolsUnknownWithPolicies[toolCid]) {
                    newState.toolsUnknownWithPolicies[toolCid].delegatees = [
                        ...newState.toolsUnknownWithPolicies[toolCid]
                            .delegatees,
                        delegateeAddress,
                    ];
                }
                return newState;
            });

            setSuccess("Delegatee added to tool successfully");
            // Clear the input field after successful addition
            setNewToolDelegatee("");
        } catch (err) {
            setError("Failed to add delegatee to tool");
            console.error(err);
        } finally {
            setLoading("addToolDelegatee", false, toolCid);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8">
            <Header network={network} setNetwork={setNetwork} />

            <div className="space-y-8">
                <div className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="bg-green-50 border-green-200">
                            <Shield className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">
                                Success
                            </AlertTitle>
                            <AlertDescription className="text-green-700">
                                {success}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Agent Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                className="md:col-span-3"
                                placeholder="Enter Agent Address"
                                value={agentAddress}
                                onChange={(e) =>
                                    setAgentAddress(e.target.value)
                                }
                            />
                            <Button
                                onClick={fetchAgentDetails}
                                disabled={loadingStates.fetch || !agentAddress}
                                variant="secondary"
                                className="w-full"
                            >
                                {loadingStates.fetch
                                    ? "Fetching..."
                                    : "Fetch Permissions"}
                            </Button>
                        </div>

                        <div className="border-t pt-6">
                            <Button
                                onClick={mintAgentWallet}
                                disabled={
                                    loadingStates.fetch ||
                                    loadingStates.mint ||
                                    loadingStates.addTool ||
                                    loadingStates.addDelegatee ||
                                    Object.values(
                                        loadingStates.removeTool
                                    ).some(Boolean) ||
                                    Object.values(
                                        loadingStates.removeDelegatee
                                    ).some(Boolean)
                                }
                                className="w-full md:w-auto"
                            >
                                {loadingStates.mint
                                    ? "Minting..."
                                    : "Mint New Agent Wallet"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Manage Tools</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                className="md:col-span-3"
                                placeholder="Tool IPFS CID"
                                value={newTool}
                                onChange={(e) => setNewTool(e.target.value)}
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => addTool(newTool)}
                                disabled={loadingStates.addTool || !newTool}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {loadingStates.addTool
                                    ? "Adding..."
                                    : "Add Tool"}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {getAllTools().map((tool, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-50 rounded p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-sm">
                                                {getToolName(tool)}
                                            </span>
                                            <code className="text-xs text-gray-500 hidden md:inline">
                                                {tool}
                                            </code>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    toggleTool(
                                                        tool,
                                                        !toolsData
                                                            ?.toolsUnknownWithPolicies[
                                                            tool
                                                        ]?.toolEnabled
                                                    )
                                                }
                                                disabled={
                                                    loadingStates.toggleTool[
                                                        tool
                                                    ] ||
                                                    loadingStates
                                                        .addToolDelegatee[tool]
                                                }
                                            >
                                                {loadingStates.toggleTool[tool]
                                                    ? "Updating..."
                                                    : toolsData
                                                          ?.toolsUnknownWithPolicies[
                                                          tool
                                                      ]?.toolEnabled
                                                    ? "Disable"
                                                    : "Enable"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setShowDelegateeInput(
                                                        showDelegateeInput ===
                                                            tool
                                                            ? null
                                                            : tool
                                                    );
                                                    setNewToolDelegatee("");
                                                }}
                                                disabled={
                                                    loadingStates
                                                        .addToolDelegatee[tool]
                                                }
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                {loadingStates.addToolDelegatee[
                                                    tool
                                                ]
                                                    ? "Adding..."
                                                    : "Add Delegatee"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeTool(tool)}
                                                disabled={
                                                    loadingStates.removeTool[
                                                        tool
                                                    ] ||
                                                    loadingStates
                                                        .addToolDelegatee[tool]
                                                }
                                            >
                                                <Minus className="h-3 w-3 mr-1" />
                                                {loadingStates.removeTool[tool]
                                                    ? "Removing..."
                                                    : "Remove"}
                                            </Button>
                                        </div>
                                    </div>

                                    {showDelegateeInput === tool && (
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                                            <Input
                                                className="md:col-span-3"
                                                placeholder="Enter delegatee address"
                                                value={newToolDelegatee}
                                                onChange={(e) =>
                                                    setNewToolDelegatee(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    if (newToolDelegatee) {
                                                        addDelegateeTool(
                                                            tool,
                                                            newToolDelegatee
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    !newToolDelegatee ||
                                                    loadingStates
                                                        .addToolDelegatee[tool]
                                                }
                                            >
                                                {loadingStates.addToolDelegatee[
                                                    tool
                                                ]
                                                    ? "Adding..."
                                                    : "Add"}
                                            </Button>
                                        </div>
                                    )}

                                    {getDelegateesForTool(tool).length > 0 && (
                                        <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                            <div className="text-xs text-gray-600 mb-1">
                                                Delegatees:
                                            </div>
                                            <div className="space-y-1">
                                                {getDelegateesForTool(tool).map(
                                                    (delegatee, dIndex) => (
                                                        <div
                                                            key={dIndex}
                                                            className="flex items-center justify-between bg-white p-2 rounded text-sm"
                                                        >
                                                            <code className="text-xs text-gray-600">
                                                                {delegatee}
                                                            </code>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7"
                                                                onClick={() =>
                                                                    removeDelegatee(
                                                                        delegatee
                                                                    )
                                                                }
                                                                disabled={
                                                                    loadingStates
                                                                        .removeDelegatee[
                                                                        delegatee
                                                                    ] ||
                                                                    Object.values(
                                                                        loadingStates
                                                                    ).some(
                                                                        (val) =>
                                                                            typeof val ===
                                                                            "boolean"
                                                                                ? val
                                                                                : Object.values(
                                                                                      val
                                                                                  ).some(
                                                                                      Boolean
                                                                                  )
                                                                    )
                                                                }
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                                {loadingStates
                                                                    .removeDelegatee[
                                                                    delegatee
                                                                ]
                                                                    ? "Removing..."
                                                                    : "Remove"}
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Manage Delegatees</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                className="md:col-span-3"
                                placeholder="Delegatee Address"
                                value={newDelegatee}
                                onChange={(e) =>
                                    setNewDelegatee(e.target.value)
                                }
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => addDelegatee(newDelegatee)}
                                disabled={
                                    loadingStates.addDelegatee || !newDelegatee
                                }
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {loadingStates.addDelegatee
                                    ? "Adding..."
                                    : "Add Delegatee"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {delegatees.map((delegatee, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                >
                                    <code className="font-mono text-xs">
                                        {delegatee}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7"
                                        onClick={() =>
                                            removeDelegatee(delegatee)
                                        }
                                        disabled={
                                            loadingStates.removeDelegatee[
                                                delegatee
                                            ] ||
                                            Object.values(loadingStates).some(
                                                (val) =>
                                                    typeof val === "boolean"
                                                        ? val
                                                        : Object.values(
                                                              val
                                                          ).some(Boolean)
                                            )
                                        }
                                    >
                                        <Minus className="h-3 w-3" />
                                        {loadingStates.removeDelegatee[
                                            delegatee
                                        ]
                                            ? "Removing..."
                                            : "Remove"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
