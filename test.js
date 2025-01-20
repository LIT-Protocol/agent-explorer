import { LitContracts } from '@lit-protocol/contracts-sdk';
import ethers from 'ethers';
// const pkpId = await contractClient.pubkeyRouterContract.read.ethAddressToPkpId('0x0000000000000000000000000000000000000000')

export async function mintPKPUsingEthWallet() {
    console.log("minting started..");

    const provider = new ethers.providers.JsonRpcProvider(
        `https://yellowstone-rpc.litprotocol.com/`
    );
    
    const key = 'd653763be1854048e1a70dd9fc94d47c09c790fb1530a01ee65257b0b698c352'
    const wallet = new ethers.Wallet(key, provider);
    const litContracts = new LitContracts({
        signer: wallet,
        network: 'datil-dev',
        debug: false,
    });
    await litContracts.connect();

    const mintedPkp = await litContracts.pkpNftContractUtils.write.mint();
    console.log("Minted PKP to your wallet: ", mintedPkp.pkp);
}
mintPKPUsingEthWallet()