import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "./wallet/wallet.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { amountToNumber } from "@metaplex-foundation/umi";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("G2LtzXrujN5pS49tSYKpubcCVXAJti9DCWe1cS788CAo");

// Recipient address
const to = new PublicKey("jD2zixkSwHRRjg95QFctKsahCj7ZLdufivP579qny12");

const amount = 10 * 1_000_000; // 10 tokens if decimals = 6

(async () => {
    try {
        // Get the token account of the fromWallet address, and if it does not exist, create it
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            keypair.publicKey,
        );

        // Get the token account of the toWallet address, and if it does not exist, create it
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,            // payer (payer of account creation fee)
            mint,               
            to                  // recipient owner
        );

        // Transfer the new token to the "toTokenAccount" we just created
        const tx  = await transfer(
            connection,
            keypair,
            fromTokenAccount.address,
            toTokenAccount.address,
            keypair,
            amount
        )

        console.log(`Txn sig: ${tx}`)
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();

// Txn sig: 4CuSgpDEsU2pbpQMqb1Hpyrtz9hBf9KPKHB8Ahqj5M7DNVRYbnDMqRCjhrjtQrKhTYFczLacS6bdEh4mWxb6kpuU