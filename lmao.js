import {
    getNetworkConfig,
    PROVIDER_URL,
    PKP_PERMISSIONS_ABI,
    PUBKEY_ROUTER_ABI,
    PKP_TOOL_POLICY_REGISTRY_ABI,
    PKP_NFT_ABI,
} from "./config";


// interface DecodedValue {
//     [key: string]: any; // Can be any type since policy structure is dynamic
// }

// const extractPolicyStructure = (actionCode: string): string => {
//     // Look for tuple definition in the policy validation section
//     const policyMatch = actionCode.match(
//         /const\s+decodedPolicy\s*=\s*ethers\.utils\.defaultAbiCoder\.decode\(\s*\[\s*"([^"]+)"\s*\]/
//     );

//     if (!policyMatch) {
//         throw new Error(
//             "Could not find policy structure in action code"
//         );
//     }

//     return policyMatch[1];
// };

// async function decodePolicy(
//     encodedPolicy: string,
//     ipfsCid: string
// ): Promise<{
//     decodedPolicy: DecodedValue | null;
//     error?: string;
//     version?: string; // Add version to return type
// }> {
//     console.log(`Decoding policy for IPFS CID: ${ipfsCid}`);
//     console.log("Encoded policy:", encodedPolicy);

//     try {
//         // 1. Fetch the Lit Action code from IPFS
//         const response = await fetch(`https://ipfs.io/ipfs/${ipfsCid}`);
//         if (!response.ok) {
//             throw new Error(
//                 `Failed to fetch Lit Action code: ${response.status}`
//             );
//         }

//         const actionCode = await response.text();

//         // 2. Extract the policy structure
//         const policyStructure = extractPolicyStructure(actionCode);
//         console.log("Extracted policy structure:", policyStructure);

//         // 3. Create ABI coder and decode
//         const abiCoder = new ethers.utils.AbiCoder();
//         const [decodedData] = abiCoder.decode(
//             [policyStructure],
//             ethers.utils.arrayify(encodedPolicy)
//         );

//         // 4. Format the decoded policy - handle any structure
//         const formatValue = (value: any): any => {
//             if (Array.isArray(value)) {
//                 return value.map((v) => formatValue(v));
//             }
//             if (ethers.BigNumber.isBigNumber(value)) {
//                 return value; // Keep as BigNumber for precise handling
//             }
//             if (typeof value === "string" && value.startsWith("0x")) {
//                 try {
//                     return ethers.utils.getAddress(value); // Normalize addresses
//                 } catch {
//                     return value; // Not an address, keep as is
//                 }
//             }
//             return value;
//         };

//         const formattedPolicy = Object.keys(decodedData).reduce(
//             (acc, key) => {
//                 acc[key] = formatValue(decodedData[key]);
//                 return acc;
//             },
//             {} as DecodedValue
//         );

//         console.log(
            "Decoded policy:",
            JSON.stringify(
                formattedPolicy,
                (_, value) =>
                    ethers.BigNumber.isBigNumber(value)
                        ? value.toString()
                        : value,
                2
            )
        );

        return {
            decodedPolicy: formattedPolicy,
            version: decodedData.version || "1.0", // Add default version if not present
        };
    } catch (error) {
        console.error("Error in decodePolicy:", error);
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
            decodedPolicy: null,
        };
    }
}



            // 
            // 
            // 

            // const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
            // const networkConfig = getNetworkConfig(network);

            // const pubkeyRouterContract = new ethers.Contract(
            //     networkConfig.PUBKEY_ROUTER,
            //     PUBKEY_ROUTER_ABI,
            //     provider
            // );

            // console.log("walletAddress", walletAddress);
            // const pkpId = await pubkeyRouterContract.ethAddressToPkpId(
            //     walletAddress
            // );
            // console.log("pkpId", pkpId);


            // const test = await sdk.getAllRegisteredTools(pkpId);
            // console.log("test", test);

         
            // const policyRegistryContract = new ethers.Contract(
            //     networkConfig.PKP_TOOL_POLICY_REGISTRY,
            //     PKP_TOOL_POLICY_REGISTRY_ABI,
            //     provider
            // );

            // const registeredTools =
            //     await policyRegistryContract.getAllRegisteredTools(pkpId);

            // console.log("registeredTools", registeredTools);

            // const delegatees = await policyRegistryContract.getDelegatees(
            //     pkpId
            // );

            // console.log("delegatees", delegatees);

                    

        // const pkpPermissionsContract = new ethers.Contract(
        //     networkConfig.PKP_PERMISSIONS,
        //     PKP_PERMISSIONS_ABI,
        //     provider
        // );

        // const authMethods = await pkpPermissionsContract.getPermittedActions(
        //     pkpId
        // );

        // const bytesToString = async (_bytes: string) => {
        //     const hexString = _bytes.startsWith("0x")
        //         ? _bytes.slice(2)
        //         : _bytes;
        //     const buffer = Buffer.from(hexString, "hex");
        //     const string = bs58.encode(buffer);
        //     return string;
        // };

        // const permittedActions = await Promise.all(
        //     authMethods.map((method: string) => bytesToString(method))
        // );

        // console.log("permittedActions", permittedActions);

                // const contractPKPNFT = new ethers.Contract(
        //     networkConfig.PKP_NFT,
        //     PKP_NFT_ABI,
        //     provider
        // );
        // const admin = await contractPKPNFT.ownerOf(pkpId);


        // const policies = await Promise.all(
            //     registeredTools.map(async ([cid, _]: [string, boolean]) => {
            //         // Destructure the array elements
            //         const toolPolicy = await sdk.getRegisteredTool(pkpId, cid);
            //         console.log("toolPolicy", toolPolicy);
            //         return toolPolicy;

            //     const encodedPolicy = ethers.utils.hexlify(
            //         toolPolicy.policy
            //     );
            //     const decodedPolicy = decodePolicy(
            //         toolPolicy.policy,
            //         cid
            //     );

            //     return {
            //         toolName: `Tool ${index + 1}`,
            //         ipfsCid: cid,
            //         delegatees: delegatees,
            //         encodedPolicy,
            //         decodedPolicy: {
            //             decodedPolicy,
            //             version: toolPolicy.version,
            //         },
            //     };
            //     })
            // );