"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import bs58 from "bs58";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    getNetworkConfig,
    PROVIDER_URL,
    PKP_PERMISSIONS_ABI,
    PUBKEY_ROUTER_ABI,
    PKP_TOOL_POLICY_REGISTRY_ABI,
    PKP_NFT_ABI,
} from "./config";

interface AgentDetails {
    admin: string;
    policies: {
        toolName: string;
        ipfsCid: string;
        delegatees: string[];
        encodedPolicy: string;
    }[];
    permittedActions: string[];
}

const AgentSecurityChecker = () => {
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

    if (!mounted) {
        return null;
    }

    const bytesToString = async (_bytes: string) => {
        const hexString = _bytes.startsWith("0x") ? _bytes.slice(2) : _bytes;
        const buffer = Buffer.from(hexString, "hex");
        const string = bs58.encode(buffer);
        return string;
    };

    const fetchAgentDetails = async () => {
        try {
            setIsLoading(true);
            setAgentDetails(null);
            setError("");

            const networkConfig = getNetworkConfig("datil");

            const provider = new ethers.providers.JsonRpcProvider(
              PROVIDER_URL
            );

            const pubkeyRouterContract = new ethers.Contract(
                networkConfig.PUBKEY_ROUTER,
                PUBKEY_ROUTER_ABI,
                provider
            );

            const policyRegistryContract = new ethers.Contract(
                networkConfig.PKP_TOOL_POLICY_REGISTRY,
                PKP_TOOL_POLICY_REGISTRY_ABI,
                provider
            );

            const pkpPermissionsContract = new ethers.Contract(
                networkConfig.PKP_PERMISSIONS,
                PKP_PERMISSIONS_ABI,
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

            const registeredTools =
                await policyRegistryContract.getRegisteredTools(pkpId);
            const delegatees = await policyRegistryContract.getDelegatees(
                pkpId
            );

            const authMethods =
                await pkpPermissionsContract.getPermittedActions(pkpId);
            const permittedActions = await Promise.all(
                authMethods.map((method: string) => bytesToString(method))
            );

            const policies = await Promise.all(
                registeredTools.ipfsCids.map(
                    async (cid: string, index: number) => {
                        const toolPolicy =
                            await policyRegistryContract.getToolPolicy(
                                pkpId,
                                cid
                            );

                        return {
                            toolName: `Tool ${index + 1}`,
                            ipfsCid: cid,
                            delegatees: delegatees,
                            encodedPolicy: ethers.utils.hexlify(
                                toolPolicy.policy
                            ),
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">
                    Agent Security Checker
                </h1>
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
