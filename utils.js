/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */

import ethers from "ethers";
import bs58 from "bs58";
let provider = new ethers.providers.JsonRpcProvider(
    "https://yellowstone-rpc.litprotocol.com"
);

// datil-dev
const PKPToolPolicyRegistryContractAddress =
    "0xdeb70dcbc7432fefedae900aff11dcc5169cfcbb";

const PKPToolPolicyRegistryABI = [
    {
        inputs: [
            {
                internalType: "uint256",
                name: "pkpTokenId",
                type: "uint256",
            },
        ],
        name: "getRegisteredTools",
        outputs: [
            {
                internalType: "string[]",
                name: "ipfsCids",
                type: "string[]",
            },
            {
                internalType: "bytes[]",
                name: "policyData",
                type: "bytes[]",
            },
            {
                internalType: "string[]",
                name: "versions",
                type: "string[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "pkpTokenId",
                type: "uint256",
            },
        ],
        name: "getDelegatees",
        outputs: [
            {
                internalType: "address[]",
                name: "",
                type: "address[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "pkpTokenId",
                type: "uint256",
            },
            {
                internalType: "string",
                name: "ipfsCid",
                type: "string",
            },
        ],
        name: "getToolPolicy",
        outputs: [
            {
                internalType: "bytes",
                name: "policy",
                type: "bytes",
            },
            {
                internalType: "string",
                name: "version",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];

const PubkeyRouterContractAddress =
    "0xbc01f21C58Ca83f25b09338401D53D4c2344D1d9";

const PubkeyRouterABI = [
    {
        inputs: [
            {
                internalType: "address",
                name: "ethAddress",
                type: "address",
            },
        ],
        name: "ethAddressToPkpId",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
            },
        ],
        name: "getEthAddress",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];

const PKPNFTContractAddress = "0x02C4242F72d62c8fEF2b2DB088A35a9F4ec741C7";

const PKPNFTABI = [
    {
        inputs: [
            {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
            },
        ],
        name: "ownerOf",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];

const PKPPERMISSIONSContractAddress =
    "0xf64638F1eb3b064f5443F7c9e2Dc050ed535D891";

// const PKPPERMISSIONSABI = [
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "tokenId",
//                 type: "uint256",
//             },
//         ],
//         outputs: [
//             {
//                 components: [
//                     {
//                         internalType: "uint256",
//                         name: "authMethodType",
//                         type: "uint256",
//                     },
//                     {
//                         internalType: "bytes",
//                         name: "id",
//                         type: "bytes",
//                     },
//                     {
//                         internalType: "bytes",
//                         name: "userPubkey",
//                         type: "bytes",
//                     },
//                 ],
//                 internalType: "struct LibPKPPermissionsStorage.AuthMethod[]",
//                 name: "",
//                 type: "tuple[]",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//         name: "getPermittedAuthMethods",
//     },
// ];

const PKPPERMISSIONSABI = [
    {
        inputs: [
            {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
            },
        ],
        name: "getPermittedActions",
        outputs: [
            {
                internalType: "bytes[]",
                name: "",
                type: "bytes[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];

// const ethAddress = "0x5659463C9954a10Aab26981C2DbCb443B0ca194d";
// const ethAddress = "0x89fEe957f91fDc22942EC09C4a610F81930D19De";
// const ethAddress = "0x48e6a467852Fa29710AaaCDB275F85db4Fa420eB";
// const contractPubKeyRouter = new ethers.Contract(
//     PubkeyRouterContractAddress,
//     PubkeyRouterABI,
//     provider
// );
// const pkpId = await contractPubKeyRouter.ethAddressToPkpId(ethAddress);
// console.log(pkpId);

// const contractPKPToolPolicyRegistry = new ethers.Contract(
//     PKPToolPolicyRegistryContractAddress,
//     PKPToolPolicyRegistryABI,
//     provider
// );
// const registeredTools = await contractPKPToolPolicyRegistry.getRegisteredTools(
//     pkpId
// );
// const delegatees = await contractPKPToolPolicyRegistry.getDelegatees(pkpId);
// if (registeredTools.ipfsCids.length > 0) {
//     const firstToolCid = registeredTools.ipfsCids[0];
//     const toolPolicy = await contractPKPToolPolicyRegistry.getToolPolicy(
//         pkpId,
//         firstToolCid
//     );
//     console.log("Tool Policy:", toolPolicy);
// }
// console.log(registeredTools);
// console.log(delegatees);

// const contractPKPNFT = new ethers.Contract(
//     PKPNFTContractAddress,
//     PKPNFTABI,
//     provider
// );
// const tokenId = '0x63d03b31c3249bfabb0536a5b4a4a75e7a7d0c8646675d6bcbd94dc1c344f66f';
// const pkpEthAddress = await contractPKPNFT.getEthAddress(tokenId)
// console.log(pkpEthAddress)
// const admin = await contractPKPNFT.ownerOf(pkpId);
// console.log(admin);

async function bytesToString(_bytes) {
    const hexString = _bytes.startsWith('0x') ? _bytes.slice(2) : _bytes;
    const buffer = Buffer.from(hexString, 'hex');
    const string = bs58.encode(buffer);
    return string;
}

const ethAddress = "0x8a1A488BDC6040e63CF2ED6d1437333E6aC3d0Be";
const contractPubKeyRouter = new ethers.Contract(
    PubkeyRouterContractAddress,
    PubkeyRouterABI,
    provider
);
const pkpId = await contractPubKeyRouter.ethAddressToPkpId(ethAddress);
// console.log(pkpId);
const contractPKPPermissions = new ethers.Contract(
    PKPPERMISSIONSContractAddress,
    PKPPERMISSIONSABI,
    provider
);
const authMethods = await contractPKPPermissions.getPermittedActions(pkpId);
const convertedAuthMethods = await Promise.all(
    authMethods.map(method => bytesToString(method))
);
console.log(convertedAuthMethods);
