import { 
    Admin,
} from '@lit-protocol/agent-wallet';

async function getPoliciesForTools(
    privateKey, 
    litNetwork = 'datil-dev',
    pkpAddress
) {
    try {
        // Initialize the Admin instance to access policy checking capabilities
        const admin = await Admin.create(
            {
                type: 'eoa',
                privateKey
            },
            {
                litNetwork
            }
        );

        // If PKP address provided, use it, otherwise get all PKPs
        const pkpTokenId = pkpAddress 
            ? await admin.getPkpByTokenId(pkpAddress)
            : (await admin.getPkps())[0]?.info.tokenId; // Get first PKP if no address specified

        if (!pkpTokenId) {
            throw new Error("No PKP found");
        }

        // Get all registered tools for this PKP
        const registeredTools = await admin.getRegisteredToolsForPkp(pkpTokenId);

        console.log("Tools with policies:");
        
        // For each tool that has a policy, fetch and decode it
        for (const tool of registeredTools.toolsWithPolicies) {
            console.log(`\nTool: ${tool.name} (${tool.ipfsCid})`);
            
            // Get encoded policy data from contract
            const { policy: encodedPolicy, version } = await admin.getToolPolicy(
                pkpTokenId,
                tool.ipfsCid
            );

            // Use the tool's policy decoder to convert to human readable format
            const decodedPolicy = tool.policy.decode(encodedPolicy);

            console.log("Version:", version);
            console.log("Decoded Policy:", JSON.stringify(decodedPolicy, null, 2));
        }

        // Display tools without policies for completeness
        console.log("\nTools without policies:");
        registeredTools.toolsWithoutPolicies.forEach(tool => {
            console.log(`- ${tool.name} (${tool.ipfsCid})`);
        });

        // Cleanup
        admin.disconnect();

    } catch (error) {
        console.error("Error fetching policies:", error);
        throw error;
    }
}

// Example usage
const PRIVATE_KEY = "your_private_key";
const PKP_ADDRESS = "optional_pkp_address"; // e.g. "0x..."

getPoliciesForTools(PRIVATE_KEY, 'datil-dev', PKP_ADDRESS)
    .catch(console.error);