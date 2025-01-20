type NetworkConfig = {
    PUBKEY_ROUTER: string;
    PKP_TOOL_POLICY_REGISTRY: string;
    PKP_NFT: string;
    PKP_PERMISSIONS: string;
};

export const PROVIDER_URL = "https://yellowstone-rpc.litprotocol.com";

export const PUBKEY_ROUTER_ABI = [
    {
        inputs: [
            { internalType: "address", name: "ethAddress", type: "address" },
        ],
        name: "ethAddressToPkpId",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
];

export const PKP_TOOL_POLICY_REGISTRY_ABI = [
    {
        inputs: [
            { internalType: "uint256", name: "pkpTokenId", type: "uint256" },
        ],
        name: "getRegisteredTools",
        outputs: [
            { internalType: "string[]", name: "ipfsCids", type: "string[]" },
            { internalType: "bytes[]", name: "policyData", type: "bytes[]" },
            { internalType: "string[]", name: "versions", type: "string[]" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "pkpTokenId", type: "uint256" },
        ],
        name: "getDelegatees",
        outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "pkpTokenId", type: "uint256" },
            { internalType: "string", name: "ipfsCid", type: "string" },
        ],
        name: "getToolPolicy",
        outputs: [
            { internalType: "bytes", name: "policy", type: "bytes" },
            { internalType: "string", name: "version", type: "string" },
        ],
        stateMutability: "view",
        type: "function",
    },
];

export const PKP_NFT_ABI = [
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "ownerOf",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
];

export const PKP_PERMISSIONS_ABI = [
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "getPermittedActions",
        outputs: [{ internalType: "bytes[]", name: "", type: "bytes[]" }],
        stateMutability: "view",
        type: "function",
    },
];

const networks: Record<string, NetworkConfig> = {
    datil: {
        PUBKEY_ROUTER: "0xbc01f21C58Ca83f25b09338401D53D4c2344D1d9",
        PKP_TOOL_POLICY_REGISTRY: "0xdeb70dcbc7432fefedae900aff11dcc5169cfcbb",
        PKP_NFT: "0x02C4242F72d62c8fEF2b2DB088A35a9F4ec741C7",
        PKP_PERMISSIONS: "0xf64638F1eb3b064f5443F7c9e2Dc050ed535D891",
    },
};

export const getNetworkConfig = (network: string): NetworkConfig => {
    const config = networks[network];
    if (!config) {
        throw new Error(`Network configuration not found for: ${network}`);
    }
    return config;
};
