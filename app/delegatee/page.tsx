"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Header } from "@/app/components/Header";
import { Card } from "@/components/ui/card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DelegateeSearchPage = () => {
    const router = useRouter();
    const [network, setNetwork] = React.useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("selectedNetwork") || "datil-dev";
        }
        return "datil-dev";
    });

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Header network={network} setNetwork={setNetwork} />
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
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const value = (e.target as HTMLInputElement)
                                        .value;
                                    if (value) {
                                        router.push(`/delegatee/${value}`);
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
                                    router.push(`/delegatee/${input.value}`);
                                }
                            }}
                        >
                            Check Delegations
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DelegateeSearchPage;
