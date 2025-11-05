import wallet from "../../task-2/spl-mint/wallet/wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

        const image = "https://gateway.irys.xyz/4ZWyFEt4o1SjJCHC9aZLBg4GctCwXG2wi3zJaetGvu5c";
        const metadata = {
            name: "Shiba Inu",
            symbol: "SHIB",
            description: "A cute shib to make your day",
            image,
            attributes: [
                {trait_type: "Rarity", value: "Rare"},
                {trait_type: "Creator", value: "sm1-turbin3"}
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: "?"
                    },
                ]
            },
            creators: ["SM1-TURBIN3"]
        };
        const myUri = await umi.uploader.uploadJson(metadata);
        console.log("Your metadata URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();

// Your metadata URI:  https://gateway.irys.xyz/DZanK7itTfWLPZ6E6K37X8f8YeGHRhrkZTJFjVQe9SkS