import * as anchor from "@coral-xyz/anchor";
import { VaultSavings } from "../target/types/vault_savings";

(async () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.vaultSavings as anchor.Program<VaultSavings>;

    const vaultState = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), provider.wallet.publicKey.toBuffer()],
    program.programId
  )[0];

  const vault = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vaultState.toBuffer()],
    program.programId
  )[0];

  console.log("Vault State PDA:", vaultState.toBase58());
  console.log("Vault PDA:", vault.toBase58());

  // Initialize if not already done
  const txInit = await program.methods
    .initialize(new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL))
    .accountsPartial({
      user: provider.wallet.publicKey,
      state: vaultState,
      vault,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Initialized. Tx:", txInit);

  // Deposit 1.5 SOL
  const depositAmount = new anchor.BN(1.5 * anchor.web3.LAMPORTS_PER_SOL);

  const txDeposit = await program.methods
    .deposit(depositAmount)
    .accountsPartial({
      user: provider.wallet.publicKey,
      state: vaultState,
      vault,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Deposit successful. Tx:", txDeposit);
})();

// Vault State PDA: CZR7UZ9rma2bPVc9PWYQRraccWZPdRomRfdRMtALFfVZ
// Vault PDA: 56YLa6xxcb5UHnjvycJuCHjKp4ygnav5r4WGWVwJJspY
// ✅ Initialized. Tx: 5vyPdwsGviev25moYsrGJCB9KRX1fuQrfnt1MoArKgaY37C2Bvy4PLqZuNkwqvVCM294eRTvAoHHewSoskvYYzVA
// ✅ Deposit successful. Tx: 5jnSJAKekh23JF6UjTUYuGTcS38ruoX1rjfTjegxi8HfFE4x7mkrKJkPGAkqT1uTf7CFsPCjX3y96SDhbkgduQUp