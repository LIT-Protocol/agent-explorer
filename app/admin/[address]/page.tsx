"use client";
import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/app/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, Plus, Minus, ArrowUpRight } from "lucide-react";
import {
    PkpToolRegistryContract,
    listAllTools,
} from "@lit-protocol/agent-wallet";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";

interface Props {
    params: {
        address: string;
    };
}

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

// Add new interface for supported tools
interface SupportedTool {
    name: string;
    cid: string;
    description: string;
}

// Add new function to process tools based on network
function processToolsForNetwork(
    toolsResponse: any[],
    network: string
): SupportedTool[] {
    return toolsResponse
        .filter((item) => item.network === network)
        .map((item) => ({
            name: item.tool.name,
            cid: item.tool.ipfsCid,
            description: item.tool.description,
        }));
}

// Add utility function to truncate CID
function truncateCid(
    cid: string,
    startLength: number = 10,
    endLength: number = 4
): string {
    if (cid.length <= startLength + endLength) return cid;
    return `${cid.slice(0, startLength)}...${cid.slice(-endLength)}`;
}

// Update resolveToolName to use truncation
function resolveToolName(cid: string, tools: SupportedTool[]): string {
    const tool = tools.find((t) => t.cid === cid);
    return tool?.name || truncateCid(cid); // Return truncated CID if tool name not found
}

export default function AdminPage({ params }: Props) {
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
        transferAgentWallet: boolean;
        removeTool: Record<string, boolean>;
        removeDelegatee: Record<string, boolean>;
        toggleTool: Record<string, boolean>;
        togglePolicy: Record<string, boolean>;
        addToolDelegatee: Record<string, boolean>;
        addToolPolicy: Record<string, boolean>;
    }>({
        fetch: false,
        mint: false,
        addTool: false,
        addDelegatee: false,
        transferAgentWallet: false,
        removeTool: {},
        removeDelegatee: {},
        toggleTool: {},
        togglePolicy: {},
        addToolDelegatee: {},
        addToolPolicy: {},
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [newTool, setNewTool] = useState("");
    const [newDelegatee, setNewDelegatee] = useState("");
    const [delegatees, setDelegatees] = useState<string[]>([]);
    const [policyDelegateeAddress, setPolicyDelegateeAddress] =
        useState<string>("");
    const [newAgentOwner, setNewAgentOwner] = useState("");
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

    const [toolsData, setToolsData] = useState<ToolsData | null>(null);
    const [toolNames, setToolNames] = useState<Record<string, string>>({});
    const [showDelegateeInput, setShowDelegateeInput] = useState<string | null>(
        null
    );
    const [newToolDelegatee, setNewToolDelegatee] = useState("");
    const [showPolicyInput, setShowPolicyInput] = useState<string | null>(null);
    const [newPolicy, setNewPolicy] = useState("");

    // Update supportedTools state to include description
    const [supportedTools, setSupportedTools] = useState<SupportedTool[]>([]);
    const [showSupportedTools, setShowSupportedTools] = useState(false);

    // Add ref for the dropdown container
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Add click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowSupportedTools(false);
            }
        }

        // Add event listener when dropdown is shown
        if (showSupportedTools) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        // Cleanup
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSupportedTools]);

    // Update fetchSupportedTools function
    async function fetchSupportedTools() {
        try {
            const tools = listAllTools();
            // Determine current network - you'll need to replace this with your actual network detection logic
            const currentNetwork = "datil-dev"; // Example: replace with actual network detection
            const processedTools = processToolsForNetwork(
                tools,
                currentNetwork
            );
            // console.log(processedTools);
            setSupportedTools(processedTools);
        } catch (error) {
            console.error("Error fetching supported tools:", error);
        }
    }

    useEffect(() => {
        fetchSupportedTools();
    }, []);

    // Update useEffect for tool name resolution
    useEffect(() => {
        const updateToolNames = async () => {
            const tools = listAllTools();
            // Get current network - replace with your actual network detection
            const currentNetwork = "datil-dev";
            const availableTools = processToolsForNetwork(
                tools,
                currentNetwork
            );

            // Get all tools from toolsData
            const existingTools = getAllTools();

            // Update tool names
            existingTools.forEach((cid) => {
                if (toolNames[cid]) return;

                // Try to resolve name from available tools
                const resolvedName = resolveToolName(cid, availableTools);
                setToolNames((prev) => ({
                    ...prev,
                    [cid]: resolvedName,
                }));
            });
        };

        updateToolNames();
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

    const getToolName = (cid: string) => {
        return toolNames[cid] || cid;
    };

    const fetchAgentDetails = async () => {
        setLoading("fetch", true);
        setError("");
        try {
            console.log("network", network);
            const pkpToolRegistryContract = new PkpToolRegistryContract({
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );

            const allToolsInfo =
                await pkpToolRegistryContract.getRegisteredToolsAndDelegateesForPkp(
                    pkpId.toString()
                );

            console.log(allToolsInfo);

            // Check enabled status for each tool
            for (const toolCid of getAllTools()) {
                const { isEnabled } =
                    await pkpToolRegistryContract.isToolRegistered(
                        pkpId.toString(),
                        toolCid
                    );
                if (allToolsInfo.toolsUnknownWithPolicies[toolCid]) {
                    allToolsInfo.toolsUnknownWithPolicies[toolCid].toolEnabled =
                        isEnabled;
                }
            }

            console.log(allToolsInfo);

            const delegatees = await pkpToolRegistryContract.getDelegatees(
                pkpId.toString()
            );

            setToolsData(allToolsInfo);
            setDelegatees(Array.isArray(delegatees) ? delegatees : []);
        } catch (err) {
            setError("Failed to fetch agent details");
            console.error(err);
        } finally {
            setLoading("fetch", false);
        }
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
                signer,
            });
            await pkpToolRegistryContract.connect();

            const response = await pkpToolRegistryContract.mintPkp();
            const pkp = response.info;

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
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();
            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            await pkpToolRegistryContract.registerTool(
                pkpId.toString(),
                toolCid
            );

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
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            await pkpToolRegistryContract.removeTool(pkpId.toString(), toolCid);

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
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            await pkpToolRegistryContract.addDelegatee(
                pkpId.toString(),
                delegateeAddress
            );

            setDelegatees((prev) => [...prev, delegateeAddress]);
            setNewDelegatee("");
            setSuccess("Delegatee added successfully");
        } catch (err) {
            setError("Failed to permit delegatee");
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
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );
            await pkpToolRegistryContract.removeDelegatee(
                pkpId.toString(),
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
                await pkpToolRegistryContract.enableTool(
                    pkpId.toString(),
                    toolCid
                );
            } else {
                await pkpToolRegistryContract.disableTool(
                    pkpId.toString(),
                    toolCid
                );
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
                litNetwork: network as LIT_NETWORKS_KEYS,
            });
            await pkpToolRegistryContract.connect();

            const pkpId =
                await pkpToolRegistryContract.getTokenIdByPkpEthAddress(
                    agentAddress
                );

            await pkpToolRegistryContract.permitToolForDelegatee(
                pkpId.toString(),
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

            setSuccess("Delegatee permitted to tool successfully");
            // Clear the input field after successful addition
            setNewToolDelegatee("");
        } catch (err) {
            setError("Failed to permit delegatee to tool");
            console.error(err);
        } finally {
            setLoading("addToolDelegatee", false, toolCid);
        }
    };

    const addToolPolicy = async (toolCid: string, policyCid: string) => {
        setLoading("addToolPolicy", true, toolCid);
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
            await pkpToolRegistryContract.setToolPolicyForDelegatee(
                pkpId.toString(),
                toolCid,
                policyDelegateeAddress,
                policyCid,
                false
            );

            setSuccess("Policy added to tool successfully");
        } catch (err) {
            setError("Failed to add policy to tool");
            console.error(err);
        } finally {
            setLoading("addToolPolicy", false, toolCid);
        }
    };

    const transferAgentWallet = async (newAgentOwner: string) => {
        setLoading("transferAgentWallet", true, newAgentOwner);
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
            await pkpToolRegistryContract.transferPkpOwnership(
                pkpId.toString(),
                newAgentOwner,
                agentAddress
            );

            setSuccess("Agent wallet transferred successfully");
        } catch (err) {
            setError("Failed to transfer agent wallet");
            console.error(err);
        } finally {
            setLoading("transferAgentWallet", false, newAgentOwner);
        }
    };

    const handleInputToggle = (tool: string, type: "policy" | "delegatee") => {
        if (type === "policy") {
            setShowPolicyInput(showPolicyInput === tool ? null : tool);
            setShowDelegateeInput(null);
            setNewPolicy("");
            setPolicyDelegateeAddress("");
        } else {
            setShowDelegateeInput(showDelegateeInput === tool ? null : tool);
            setShowPolicyInput(null);
            setNewToolDelegatee("");
        }
    };

    const togglePolicy = async (
        toolCid: string,
        delegatee: string,
        enable: boolean
    ) => {
        setLoading("togglePolicy", true, `${toolCid}-${delegatee}`);
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
                await pkpToolRegistryContract.enableToolPolicyForDelegatee(
                    pkpId.toString(),
                    toolCid,
                    delegatee
                );
            } else {
                await pkpToolRegistryContract.disableToolPolicyForDelegatee(
                    pkpId.toString(),
                    toolCid,
                    delegatee
                );
            }

            // Update toolsData state
            setToolsData((prev) => {
                if (!prev) return null;
                const newState = { ...prev };
                if (
                    newState.toolsUnknownWithPolicies[toolCid]
                        ?.delegateePolicies[delegatee]
                ) {
                    newState.toolsUnknownWithPolicies[
                        toolCid
                    ].delegateePolicies[delegatee].policyEnabled = enable;
                }
                return newState;
            });

            setSuccess(
                `Policy ${enable ? "enabled" : "disabled"} successfully`
            );
        } catch (err) {
            setError(`Failed to ${enable ? "enable" : "disable"} policy`);
            console.error(err);
        } finally {
            setLoading("togglePolicy", false, `${toolCid}-${delegatee}`);
        }
    };

    // Add new function to remove policy
    const removePolicy = async (toolCid: string, delegatee: string) => {
        setLoading("togglePolicy", true, `${toolCid}-${delegatee}`);
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

            await pkpToolRegistryContract.removeToolPolicyForDelegatee(
                pkpId.toString(),
                toolCid,
                delegatee
            );

            // Update toolsData state to remove the policy
            setToolsData((prev) => {
                if (!prev) return null;
                const newState = { ...prev };
                if (
                    newState.toolsUnknownWithPolicies[toolCid]
                        ?.delegateePolicies[delegatee]
                ) {
                    delete newState.toolsUnknownWithPolicies[toolCid]
                        .delegateePolicies[delegatee];
                }
                return newState;
            });

            setSuccess("Policy removed successfully");
        } catch (err) {
            setError("Failed to remove policy");
            console.error(err);
        } finally {
            setLoading("togglePolicy", false, `${toolCid}-${delegatee}`);
        }
    };

    useEffect(() => {
        if (agentAddress) {
            fetchAgentDetails();
        }
    }, [agentAddress]);

    return (
        <div className="max-w-4xl mx-auto p-6">
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
                        <CardTitle>Admin</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-gray-600 mb-6">
                            Manage the agent&apos;s permissions, policies and
                            delegatees as an admin.
                        </p>
                        <div className="flex gap-3 mb-4">
                            <Input
                                className="flex-1"
                                type="text"
                                placeholder="Enter Agent's Wallet Address"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && searchInput) {
                                        router.push(`/admin/${searchInput}`);
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    if (searchInput) {
                                        router.push(`/admin/${searchInput}`);
                                    }
                                }}
                                disabled={loadingStates.fetch}
                            >
                                {loadingStates.fetch
                                    ? "Checking..."
                                    : "Check Permissions"}
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
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div
                                    className="md:col-span-3 relative"
                                    ref={dropdownRef}
                                >
                                    <Input
                                        placeholder="Tool IPFS CID"
                                        value={newTool}
                                        onChange={(e) =>
                                            setNewTool(e.target.value)
                                        }
                                        onFocus={() =>
                                            setShowSupportedTools(true)
                                        }
                                    />
                                    {showSupportedTools &&
                                        supportedTools.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                                {supportedTools.map(
                                                    (tool, index) => (
                                                        <div
                                                            key={index}
                                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                            onClick={() => {
                                                                setNewTool(
                                                                    tool.cid
                                                                );
                                                                setShowSupportedTools(
                                                                    false
                                                                );
                                                            }}
                                                        >
                                                            <div className="font-medium">
                                                                {tool.name}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {
                                                                    tool.description
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {tool.cid}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                </div>
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
                                                <span
                                                    className={`text-xs ml-2 ${
                                                        toolsData
                                                            ?.toolsUnknownWithPolicies[
                                                            tool
                                                        ]?.toolEnabled
                                                            ? "text-green-600"
                                                            : "text-gray-500"
                                                    }`}
                                                >
                                                    (
                                                    {toolsData
                                                        ?.toolsUnknownWithPolicies[
                                                        tool
                                                    ]?.toolEnabled
                                                        ? "Enabled"
                                                        : "Disabled"}
                                                    )
                                                </span>
                                            </span>
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
                                                    ? "Disable Tool"
                                                    : "Enable Tool"}
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
                                                    : "Remove Tool"}
                                            </Button>
                                            <Button
                                                variant={
                                                    showPolicyInput === tool
                                                        ? "secondary"
                                                        : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    handleInputToggle(
                                                        tool,
                                                        "policy"
                                                    )
                                                }
                                                disabled={
                                                    loadingStates.addToolPolicy[
                                                        tool
                                                    ]
                                                }
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                {loadingStates.addToolPolicy[
                                                    tool
                                                ]
                                                    ? "Adding..."
                                                    : "Add Policy"}
                                            </Button>
                                            <Button
                                                variant={
                                                    showDelegateeInput === tool
                                                        ? "secondary"
                                                        : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    handleInputToggle(
                                                        tool,
                                                        "delegatee"
                                                    )
                                                }
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
                                                    : "Permit Delegatee"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-0 h-auto"
                                                onClick={() =>
                                                    router.push(`/ipfs/${tool}`)
                                                }
                                            >
                                                <span className="ml-2">→</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Add Policy Input Field */}
                                    {showPolicyInput === tool && (
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                                            <Input
                                                className="md:col-span-3"
                                                placeholder="Enter policy IPFS CID"
                                                value={newPolicy}
                                                onChange={(e) =>
                                                    setNewPolicy(e.target.value)
                                                }
                                            />
                                            <Input
                                                className="md:col-span-3"
                                                placeholder="Enter policy delegatee address"
                                                value={policyDelegateeAddress}
                                                onChange={(e) =>
                                                    setPolicyDelegateeAddress(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    if (newPolicy) {
                                                        addToolPolicy(
                                                            tool,
                                                            newPolicy
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    !newPolicy ||
                                                    loadingStates.addToolPolicy[
                                                        tool
                                                    ]
                                                }
                                            >
                                                {loadingStates.addToolPolicy[
                                                    tool
                                                ]
                                                    ? "Adding..."
                                                    : "Add"}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Permit Delegatee Input Field */}
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
                                                    ? "Permitting..."
                                                    : "Permit"}
                                            </Button>
                                        </div>
                                    )}

                                    {getDelegateesForTool(tool).length > 0 && (
                                        <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                            <div className="space-y-1">
                                                {getDelegateesForTool(tool).map(
                                                    (delegatee, dIndex) => {
                                                        const policyInfo =
                                                            toolsData
                                                                ?.toolsUnknownWithPolicies[
                                                                tool
                                                            ]
                                                                ?.delegateePolicies[
                                                                delegatee
                                                            ];

                                                        return (
                                                            <div
                                                                key={dIndex}
                                                                className="flex flex-col bg-white p-2 rounded text-sm"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-gray-500">
                                                                            Delegatee:
                                                                        </span>
                                                                        <code className="text-xs text-gray-600">
                                                                            {
                                                                                delegatee
                                                                            }
                                                                        </code>
                                                                    </div>
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
                                                                            ]
                                                                        }
                                                                    >
                                                                        <Minus className="h-3 w-3" />
                                                                        {loadingStates
                                                                            .removeDelegatee[
                                                                            delegatee
                                                                        ]
                                                                            ? "..."
                                                                            : "Unpermit"}
                                                                    </Button>
                                                                </div>
                                                                {policyInfo && (
                                                                    <div className="mt-1 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs text-gray-500">
                                                                                Policy:
                                                                            </span>
                                                                            <div className="flex items-center">
                                                                                <code className="text-xs text-gray-600">
                                                                                    {truncateCid(
                                                                                        policyInfo.policyIpfsCid
                                                                                    )}
                                                                                </code>
                                                                                <span
                                                                                    className={`text-xs ml-2 ${
                                                                                        policyInfo.policyEnabled
                                                                                            ? "text-green-600"
                                                                                            : "text-gray-500"
                                                                                    }`}
                                                                                >
                                                                                    (
                                                                                    {policyInfo.policyEnabled
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
                                                                                            `/ipfs/${policyInfo.policyIpfsCid}`
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <ArrowUpRight className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-7"
                                                                                onClick={() =>
                                                                                    togglePolicy(
                                                                                        tool,
                                                                                        delegatee,
                                                                                        !policyInfo.policyEnabled
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    loadingStates
                                                                                        .togglePolicy[
                                                                                        `${tool}-${delegatee}`
                                                                                    ]
                                                                                }
                                                                            >
                                                                                {loadingStates
                                                                                    .togglePolicy[
                                                                                    `${tool}-${delegatee}`
                                                                                ]
                                                                                    ? "..."
                                                                                    : policyInfo.policyEnabled
                                                                                    ? "Disable"
                                                                                    : "Enable"}
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-7"
                                                                                onClick={() =>
                                                                                    removePolicy(
                                                                                        tool,
                                                                                        delegatee
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    loadingStates
                                                                                        .togglePolicy[
                                                                                        `${tool}-${delegatee}`
                                                                                    ]
                                                                                }
                                                                            >
                                                                                <Minus className="h-3 w-3" />
                                                                                {loadingStates
                                                                                    .togglePolicy[
                                                                                    `${tool}-${delegatee}`
                                                                                ]
                                                                                    ? "..."
                                                                                    : "Remove"}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
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
                                    ? "Permitting..."
                                    : "Permit Delegatee"}
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
                                            : "Unpermit"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transfer Agent Wallet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                className="md:col-span-3"
                                placeholder="New Owner Address"
                                value={newAgentOwner}
                                onChange={(e) =>
                                    setNewAgentOwner(e.target.value)
                                }
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                    transferAgentWallet(newAgentOwner)
                                }
                                disabled={
                                    loadingStates.transferAgentWallet ||
                                    !newAgentOwner
                                }
                            >
                                {loadingStates.transferAgentWallet
                                    ? "Transferring..."
                                    : "Transfer Agent Wallet"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
