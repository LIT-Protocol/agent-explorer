"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Header } from "@/app/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Shield } from "lucide-react";
import { ethers } from "ethers";
import { PkpToolRegistryContract } from "@lit-protocol/agent-wallet";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types";

const AdminSearchPage = () => {
    const router = useRouter();
    const [network, setNetwork] = React.useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("selectedNetwork") || "datil-dev";
        }
        return "datil-dev";
    });

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");

    const mintAgentWallet = async () => {
        setIsLoading(true);
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

            setSuccess(`Agent wallet minted successfully!`);
            // Navigate to the new PKP's admin page
            router.push(`/admin/${pkp.ethAddress}`);
        } catch (err) {
            setError("Failed to mint agent wallet");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Header network={network} setNetwork={setNetwork} />
            <Card>
                <CardHeader>
                    <CardTitle>Admin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                            <AlertTitle className="text-green-800">Success</AlertTitle>
                            <AlertDescription className="text-green-700">
                                {success}
                            </AlertDescription>
                        </Alert>
                    )}

                    <p className="text-gray-600 mb-6">
                        Manage the agent&apos;s permissions, policies and
                        delegatees as an admin.
                    </p>
                    <div className="flex gap-3 mb-4">
                        <Input
                            className="flex-1"
                            type="text"
                            placeholder="Enter Agent's Wallet Address"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const value = (e.target as HTMLInputElement)
                                        .value;
                                    if (value) {
                                        router.push(`/admin/${value}`);
                                    }
                                }
                            }}
                        />
                        <Button
                            onClick={() => {
                                const input = document.querySelector(
                                    "input"
                                ) as HTMLInputElement;
                                if (input.value) {
                                    router.push(`/admin/${input.value}`);
                                }
                            }}
                        >
                            Check Permissions
                        </Button>
                    </div>

                    <div className="border-t pt-6">
                        <Button
                            onClick={mintAgentWallet}
                            disabled={isLoading}
                            className="w-full md:w-auto"
                        >
                            {isLoading ? "Minting..." : "Mint New Agent Wallet"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSearchPage;
