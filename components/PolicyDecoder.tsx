import { ethers } from "ethers";
import React, { useState, useEffect } from "react";

interface PolicyDecoderProps {
    encodedPolicy: string;
    ipfsCid: string;
}

const PolicyDecoder: React.FC<PolicyDecoderProps> = ({ encodedPolicy, ipfsCid }) => {
    const [decodedPolicy, setDecodedPolicy] = useState<Record<string, string | boolean | unknown[]> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const decodePolicy = async () => {
            try {
                // 1. Fetch the Lit Action code from IPFS
                const response = await fetch(`https://ipfs.io/ipfs/${ipfsCid}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const actionCode = await response.text();

                // 2. Extract the ABI structure from the code
                const decodeLine = actionCode.match(/defaultAbiCoder\.decode\(\[(.*?)\],/);
                if (!decodeLine || !decodeLine[1]) {
                    throw new Error("Could not find ABI in Lit Action code");
                }

                // 3. Parse the ABI structure
                const abiString = `[${decodeLine[1]}]`;
                const abi = JSON.parse(abiString);

                // 4. Decode the policy using ethers
                const abiCoder = new ethers.utils.AbiCoder();
                const decodedData = abiCoder.decode(
                    abi,
                    ethers.utils.arrayify(encodedPolicy)
                );

                // 5. Convert to a readable format
                const formattedPolicy: Record<string, string | boolean | unknown[]> = {};
                const tupleStructure = abi[0].match(/tuple\((.*?)\)/)?.[1];
                
                if (tupleStructure) {
                    const fields = tupleStructure.split(",").map((field: string) => {
                        const [type, name] = field.trim().split(" ");
                        return { type, name };
                    });

                    fields.forEach((field: { type: string; name: string }, index: number) => {
                        let value = decodedData[0][index];
                        
                        // Handle different types
                        if (field.type.includes("[]")) {
                            value = Array.from(value);
                        } else if (field.type === "uint256" || field.type === "int256") {
                            value = value.toString();
                        } else if (field.type === "bool") {
                            value = Boolean(value);
                        }
                        
                        formattedPolicy[field.name] = value;
                    });
                }

                setDecodedPolicy(formattedPolicy);
            } catch (err) {
                console.error("Policy decoding error:", err);
                setError(err instanceof Error ? err.message : "Unknown error occurred");
            }
        };

        if (encodedPolicy && ipfsCid) {
            decodePolicy();
        }
    }, [encodedPolicy, ipfsCid]);

    return (
        <div className="space-y-2">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                    Error decoding policy: {error}
                </div>
            )}
            
            {!decodedPolicy && !error && (
                <div className="text-gray-500 p-3">Decoding policy...</div>
            )}
            
            {decodedPolicy && (
                <div className="bg-gray-50 p-3 rounded">
                    <pre className="text-sm overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(decodedPolicy, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default PolicyDecoder; 