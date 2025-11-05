import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import wallet from "../../task-2/spl-mint/wallet/wallet.json";
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata())

const mint = generateSigner(umi);

(async () => {
    let tx = createNft(umi, {
        mint,
        name: "Vintage Rug",
        symbol: "VRUG",
        uri: "https://gateway.irys.xyz/DZanK7itTfWLPZ6E6K37X8f8YeGHRhrkZTJFjVQe9SkS",
        sellerFeeBasisPoints: percentAmount(10)
    });
    let result = await tx.sendAndConfirm(umi);
    const signature = base58.encode(result.signature);
    
    console.log(`Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`)

    console.log("Mint Address: ", mint.publicKey);
})();

// Succesfully Minted! Check out your TX here:
// https://explorer.solana.com/tx/4Hq2A2BS87N1EnKt7Rs37t9B1urm2RKsUdmKcXjL8fRLp7xLVuKD9fEfn5HdQKYTYpzUaxgcTUwTTEd1uau2sak2?cluster=devnet
// Mint Address:  H5HePwxLXaZh8etX8mz1c7FjSV2PCg8WpieY3tMVVATz