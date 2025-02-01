/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Header } from "@/app/components/Header";
import { useState } from "react";
import { Delegatee, getToolByIpfsCid } from "@lit-protocol/agent-wallet";

export default function DelegateePage() {
    const [network, setNetwork] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("selectedNetwork") || "datil-dev";
        }
        return "datil-dev";
    });
    const [delegateeDetails, setDelegateeDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDelegateeDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const sdk = await Delegatee.create(
                "d653763be1854048e1a70dd9fc94d47c09c790fb1530a01ee65257b0b698c352",
                {
                    // @ts-ignore
                    litNetwork: network,
                }
            );
            const details = await sdk.getDelegatedPkps();
            setDelegateeDetails(details);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Header network={network} setNetwork={setNetwork} />
            <div className="mt-6">
                <button 
                    onClick={fetchDelegateeDetails}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                    {isLoading ? 'Fetching...' : 'Fetch Delegatee Details'}
                </button>

                {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {delegateeDetails && (
                    <div className="mt-4">
                        <h2 className="text-xl font-bold mb-2">Delegatee Details</h2>
                        <pre className="bg-gray-100 p-4 rounded overflow-auto">
                            {JSON.stringify(delegateeDetails, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
} 