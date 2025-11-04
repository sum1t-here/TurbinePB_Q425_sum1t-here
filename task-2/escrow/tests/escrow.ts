import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { createAssociatedTokenAccount, createMint, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.escrow as Program<Escrow>;
  const connection = provider.connection;

  const maker = anchor.web3.Keypair.generate();
  const taker = anchor.web3.Keypair.generate();

  let mintA: anchor.web3.PublicKey;
  let mintB: anchor.web3.PublicKey;
  let makerAtaA: anchor.web3.PublicKey;
  let makerAtaB: anchor.web3.PublicKey;
  let takerAtaA: anchor.web3.PublicKey;
  let takerAtaB: anchor.web3.PublicKey;
  let escrowPda: anchor.web3.PublicKey;
  let vaultAta: anchor.web3.PublicKey;

  const seed = new anchor.BN(4);

  const depositAmount = new anchor.BN(1_000_000);
  const receiveAmount = new anchor.BN(2_000_000);

  before(async () => {

    // Airdrop SOL to maker for fees
    const sig1 = await provider.connection.requestAirdrop(
      maker.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig1);

    // Airdrop SOL to taker for fees
    const sig2 = await provider.connection.requestAirdrop(
      taker.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig2);


    // create 2 token mints (Token A, Token B)
    mintA = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    mintB = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    // create associated token accounts
    makerAtaA = await createAssociatedTokenAccount(connection, maker, mintA, maker.publicKey);
    makerAtaB = await createAssociatedTokenAccount(connection, maker, mintB, maker.publicKey);
    takerAtaA = await createAssociatedTokenAccount(connection, maker, mintA, taker.publicKey);
    takerAtaB = await createAssociatedTokenAccount(connection, maker, mintB, taker.publicKey);

    // mint tokens to maker and taker
    await mintTo(connection, maker, mintA, makerAtaA, maker.publicKey, 10_000_000);
    await mintTo(connection, maker, mintB, makerAtaB, maker.publicKey, 10_000_000);
    await mintTo(connection, maker, mintA, takerAtaA, maker.publicKey, 10_000_000);
    await mintTo(connection, maker, mintB, takerAtaB, maker.publicKey, 10_000_000);

    // derive PDA for Escrow
    escrowPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), maker.publicKey.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];
    
    // vault ATA owned by escrow PDA
    vaultAta = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: escrowPda
    });


    console.log("Setup done");
  });

  it("Is initialized!", async () => {
    const tx = await program.methods
      .initialize(seed, depositAmount, receiveAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([maker])
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Taker completes trade", async () => {
    const tx = await program.methods
      .take()
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaB,
        takerAtaA,
        takerAtaB,
        escrow: escrowPda,
        vault: vaultAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([taker])
      .rpc();

      console.log("Trade completed: ", tx);
  })

  it("Makers refund escrow", async () => {
    // re-init the program
    await program.methods
      .initialize(seed, depositAmount, receiveAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([maker])
      .rpc();

      // refund
      const tx = await program.methods
      .refund()
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([maker])
      .rpc();

    console.log("Escrow refunded: ", tx);
  })
});
