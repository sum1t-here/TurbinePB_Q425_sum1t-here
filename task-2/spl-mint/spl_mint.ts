import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import wallet from "./wallet/wallet.json"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const token_decimals = 1_000_000n;

const amount = BigInt(6000) * token_decimals;

// Mint address
const mint = new PublicKey("G2LtzXrujN5pS49tSYKpubcCVXAJti9DCWe1cS788CAo");

(async () => {
    try {
        // Create an ATA
        const ata = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            keypair.publicKey,
        );
        console.log(`Your ata is: ${ata.address.toBase58()}`);

        // Mint to ATA
        const mintTx = await mintTo(
            connection,
            keypair,         // payer
            mint,            // mint address
            ata.address,     // destination ATA
            keypair,         // mint authority
            amount          // number of tokens to mint
        )
        console.log(`Your mint txid: ${mintTx}`);
    } catch(error) {
        console.log(`Oops, something went wrong: ${error}`)
    }
})()

// Your ata is: 8jE4zUTgYngGKuWJ9krXFtErLFWSsSvG9nsL4RMyGtMe
// Your mint txid: xHLNGuKH5AvvtHr5TvFc4bpb6iJ3S7caGG68RNvvdvqhsTktP3e3EL44waiEFePWZuEB9jPEpNm1Sj8jjxcuskR