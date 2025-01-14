"use client"
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle } from 'lucide-react';

// Contract configuration
const PROVIDER_URL = "https://yellowstone-rpc.litprotocol.com";
const PKP_TOOL_POLICY_REGISTRY = "0xdeb70dcbc7432fefedae900aff11dcc5169cfcbb";
const PUBKEY_ROUTER = "0xbc01f21C58Ca83f25b09338401D53D4c2344D1d9";
const PKP_NFT = "0x02C4242F72d62c8fEF2b2DB088A35a9F4ec741C7";

const PubkeyRouterABI = [
  {
    inputs: [{ internalType: "address", name: "ethAddress", type: "address" }],
    name: "ethAddressToPkpId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  }
];

const PKPToolPolicyRegistryABI = [
  {
    inputs: [{ internalType: "uint256", name: "pkpTokenId", type: "uint256" }],
    name: "getRegisteredTools",
    outputs: [
      { internalType: "string[]", name: "ipfsCids", type: "string[]" },
      { internalType: "bytes[]", name: "policyData", type: "bytes[]" },
      { internalType: "string[]", name: "versions", type: "string[]" }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "pkpTokenId", type: "uint256" }],
    name: "getDelegatees",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "pkpTokenId", type: "uint256" },
      { internalType: "string", name: "ipfsCid", type: "string" }
    ],
    name: "getToolPolicy",
    outputs: [
      { internalType: "bytes", name: "policy", type: "bytes" },
      { internalType: "string", name: "version", type: "string" }
    ],
    stateMutability: "view",
    type: "function",
  }
];

const PKPNFTABI = [
  {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ownerOf",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
];

interface AgentDetails {
  admin: string;
  policies: {
    toolName: string;
    ipfsCid: string;
    delegatees: string[];
    encodedPolicy: string;
  }[];
}

const AgentSecurityChecker = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAgentDetails = async () => {
    try {
      setIsLoading(true);
      setAgentDetails(null);
      setError('');

      // Initialize provider and contracts
      const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
      
      const pubkeyRouterContract = new ethers.Contract(
        PUBKEY_ROUTER,
        PubkeyRouterABI,
        provider
      );

      const policyRegistryContract = new ethers.Contract(
        PKP_TOOL_POLICY_REGISTRY,
        PKPToolPolicyRegistryABI,
        provider
      );

      // Get PKP ID from wallet address
      const pkpId = await pubkeyRouterContract.ethAddressToPkpId(walletAddress);
      
      // Check if pkpId is BigNumber with value 0x00
      if (pkpId.isZero()) {
        throw new Error("The Agent's Authenticity couldn't be verified");
      }

      // Get registered tools and delegatees
      const registeredTools = await policyRegistryContract.getRegisteredTools(pkpId);
      const delegatees = await policyRegistryContract.getDelegatees(pkpId);

      // Format the data
      const policies = await Promise.all(
        registeredTools.ipfsCids.map(async (cid: string, index: number) => {
          const toolPolicy = await policyRegistryContract.getToolPolicy(pkpId, cid);
          
          return {
            toolName: `Tool ${index + 1}`, // You might want to fetch actual tool names from somewhere
            ipfsCid: cid,
            delegatees: delegatees,
            encodedPolicy: ethers.utils.hexlify(toolPolicy.policy)
          };
        })
      );

      const contractPKPNFT = new ethers.Contract(
        PKP_NFT,
        PKPNFTABI,
        provider
    );
    const admin = await contractPKPNFT.ownerOf(pkpId);

      setAgentDetails({
        admin: admin,
        policies
      });

    } catch (err) {
      console.error('Error fetching agent details:', err);
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
        <h1 className="text-3xl font-bold mb-4">Agent Security Checker</h1>
        <p className="text-gray-600 mb-6">
          Verify the security configuration and policies of any agent by entering their wallet address.
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
            {isLoading ? 'Checking...' : 'Check Security'}
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
            <AlertTitle className="text-green-800">Verified PKP Agent</AlertTitle>
            <AlertDescription className="text-green-700">
              This agent&apos;s authenticity has been verified through PKP.
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
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">{policy.toolName}</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">IPFS CID:</label>
                        <code className="block bg-gray-50 p-2 rounded text-sm break-all">
                          {policy.ipfsCid}
                        </code>
                      </div>

                      <div>
                        <label className="text-sm text-gray-600 block mb-1">Delegatees:</label>
                        <div className="bg-gray-50 p-2 rounded">
                          {policy.delegatees.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {policy.delegatees.map((delegatee, idx) => (
                                <li key={idx} className="font-mono text-sm break-all">
                                  {delegatee}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm">No delegatees specified</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-gray-600 block mb-1">Encoded Policy:</label>
                        <code className="block bg-gray-50 p-2 rounded text-sm break-all">
                          {policy.encodedPolicy}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}

                {agentDetails.policies.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No tools or policies registered for this agent.
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

export default AgentSecurityChecker;