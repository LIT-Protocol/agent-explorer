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
    // Tool Facet Functions
    'function registerTools(uint256 pkpTokenId, string[] calldata toolIpfsCids, bool enabled) external',
    'function removeTools(uint256 pkpTokenId, string[] calldata toolIpfsCids) external',
  
    'function enableTools(uint256 pkpTokenId, string[] calldata toolIpfsCids) external',
    'function disableTools(uint256 pkpTokenId, string[] calldata toolIpfsCids) external',
  
    'function permitToolsForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
    'function unpermitToolsForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
  
    'function getRegisteredTools(uint256 pkpTokenId, string[] calldata toolIpfsCids) external view returns (tuple(string toolIpfsCid, bool toolEnabled)[] memory toolsInfo)',
    'function getAllRegisteredTools(uint256 pkpTokenId) external view returns (tuple(string toolIpfsCid, bool toolEnabled)[] memory toolsInfo)',
    'function getRegisteredToolsAndDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address[] delegatees, string[] delegateesPolicyIpfsCids, bool[] delegateesPolicyEnabled) memory toolInfo)',
    'function getAllRegisteredToolsAndDelegatees(uint256 pkpTokenId) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address[] delegatees, string[] delegateesPolicyIpfsCids, bool[] delegateesPolicyEnabled)[] memory toolsInfo)',
    'function getToolsWithPolicy(uint256 pkpTokenId) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address[] delegatees, string[] delegateesPolicyIpfsCids, bool[] delegateesPolicyEnabled)[] memory toolsInfo)',
    'function getToolsWithoutPolicy(uint256 pkpTokenId) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address[] delegatees)[] memory toolsWithoutPolicy)',
  
    'function isToolRegistered(uint256 pkpTokenId, string calldata toolIpfsCid) external view returns (bool isRegistered, bool isEnabled)',
    'function isToolPermittedForDelegatee(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee) external view returns (bool isPermitted, bool isEnabled)',
    'function getPermittedToolsForDelegatee(uint256 pkpTokenId, address delegatee) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address delegatee, string policyIpfsCid, bool policyEnabled)[] memory permittedTools)',
  
    // Delegatee Facet Functions
    'function addDelegatees(uint256 pkpTokenId, address[] calldata delegatees) external',
    'function removeDelegatees(uint256 pkpTokenId, address[] calldata delegatees) external',
    'function getDelegatees(uint256 pkpTokenId) external view returns (address[] memory)',
    'function getDelegatedPkps(address delegatee) external view returns (uint256[] memory)',
    'function isPkpDelegatee(uint256 pkpTokenId, address delegatee) external view returns (bool)',
  
    // Policy Facet Functions
    'function getToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external view returns (tuple(string toolIpfsCid, string policyIpfsCid, address delegatee, bool enabled)[] memory toolPolicies)',
    'function setToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees, string[] calldata policyIpfsCids, bool enablePolicies) external',
    'function removeToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
    'function enableToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
    'function disableToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
  
    // Policy Parameter Facet Functions
    'function getToolPolicyParameters(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee, string[] calldata parameterNames) external view returns (tuple(string name, bytes value)[] memory parameters)',
    'function getAllToolPolicyParameters(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee) external view returns (tuple(string name, bytes value)[] memory parameters)',
    'function setToolPolicyParametersForDelegatee(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee, string[] calldata parameterNames, bytes[] calldata parameterValues) external',
    'function removeToolPolicyParametersForDelegatee(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee, string[] calldata parameterNames) external',
  
    // Error Signatures
    'error InvalidDelegatee()',
    'error EmptyDelegatees()',
    'error DelegateeAlreadyExists(uint256 pkpTokenId, address delegatee)',
    'error DelegateeNotFound(uint256 pkpTokenId, address delegatee)',
    'error EmptyIPFSCID()',
    'error ToolNotFound(string toolIpfsCid)',
    'error ToolAlreadyRegistered(string toolIpfsCid)',
    'error ArrayLengthMismatch()',
    'error InvalidPolicyParameters()',
    'error PolicyParameterAlreadySet(string parameterName)',
    'error InvalidPolicyValue()',
    'error NoPolicySet(uint256 pkpTokenId, string toolIpfsCid, address delegatee)',
    'error PolicyAlreadySet(uint256 pkpTokenId, string toolIpfsCid, address delegatee)',
    'error PolicySameEnabledState(uint256 pkpTokenId, string toolIpfsCid, address delegatee)',
    'error EmptyPolicyIPFSCID()',
    'error NotPKPOwner()',
  
    // Events
    'event ToolsRegistered(uint256 indexed pkpTokenId, bool enabled, string[] toolIpfsCids)',
    'event ToolsRemoved(uint256 indexed pkpTokenId, string[] toolIpfsCids)',
    'event ToolsEnabled(uint256 indexed pkpTokenId, string[] toolIpfsCids)',
    'event ToolsDisabled(uint256 indexed pkpTokenId, string[] toolIpfsCids)',
    'event ToolsPermitted(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
    'event AddedDelegatees(uint256 indexed pkpTokenId, address[] delegatees)',
    'event RemovedDelegatees(uint256 indexed pkpTokenId, address[] delegatees)',
    'event ToolPoliciesSet(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees, string[] policyIpfsCids)',
    'event ToolPoliciesRemoved(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
    'event PoliciesEnabled(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
    'event PoliciesDisabled(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
    'event PolicyParametersSet(uint256 indexed pkpTokenId, string toolIpfsCids, address delegatee, string[] parameterNames, bytes[] parameterValues)',
    'event PolicyParametersRemoved(uint256 indexed pkpTokenId, string toolIpfsCids, address delegatee, string[] parameterNames)',
    'event ToolsUnpermitted(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
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
    "datil-dev": {
        // PKP_TOOL_POLICY_REGISTRY: "0xdE8807799579eef5b9A84A0b4164D28E804da571",
        PKP_TOOL_POLICY_REGISTRY: "0x2707eabb60D262024F8738455811a338B0ECd3EC",

        PUBKEY_ROUTER: "0xbc01f21C58Ca83f25b09338401D53D4c2344D1d9",
        PKP_NFT: "0x02C4242F72d62c8fEF2b2DB088A35a9F4ec741C7",
        PKP_PERMISSIONS: "0xf64638F1eb3b064f5443F7c9e2Dc050ed535D891",
    },
    "datil-test": {
        // PKP_TOOL_POLICY_REGISTRY: "0x0b099F7e2520aCC52A361D1cB83fa43660C9a038",
        PKP_TOOL_POLICY_REGISTRY: "0x525bF2bEb622D7C05E979a8b3fFcDBBEF944450E",
        
        PUBKEY_ROUTER: "0x65C3d057aef28175AfaC61a74cc6b27E88405583",
        PKP_NFT: "0x6a0f439f064B7167A8Ea6B22AcC07ae5360ee0d1",
        PKP_PERMISSIONS: "0x60C1ddC8b9e38F730F0e7B70A2F84C1A98A69167",
    },
    "datil": {
        // PKP_TOOL_POLICY_REGISTRY: "0xDeb70dCBC7432fEFEdaE900AFF11Dcc5169CfcBB",
        PKP_TOOL_POLICY_REGISTRY: "0xBDEd44A02b64416C831A0D82a630488A854ab4b1",

        PUBKEY_ROUTER: "0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475",
        PKP_NFT: "0x487A9D096BB4B7Ac1520Cb12370e31e677B175EA",
        PKP_PERMISSIONS: "0x213Db6E1446928E19588269bEF7dFc9187c4829A",
    },
};

export const getNetworkConfig = (network: string): NetworkConfig => {
    const config = networks[network];
    if (!config) {
        throw new Error(`Network configuration not found for: ${network}`);
    }
    return config;
};
