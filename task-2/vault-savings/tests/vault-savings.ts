import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VaultSavings } from "../target/types/vault_savings";
import { assert, expect } from "chai";

describe("vault-savings", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.vaultSavings as Program<VaultSavings>;

  // (method) PublicKey.findProgramAddressSync(seeds: (Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>)[], programId: anchor.web3.PublicKey): [anchor.web3.PublicKey, number]

  const vaultState = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("state"), provider.wallet.publicKey.toBuffer()], program.programId)[0];

  const vault = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("vault"), vaultState.toBuffer()], program.programId)[0];

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize(new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL)).accountsPartial({
      user: provider.wallet.publicKey,
      state: vaultState,
      vault,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();
    console.log("Your transaction signature", tx);
  });

  it("Fails if deposit less than 1 SOL", async () => {
    const smallDeposit = new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL);

    let flag = "This should fail";
    try {
      await program.methods.deposit(smallDeposit)
        .accountsPartial({user: provider.wallet.publicKey, state: vaultState, vault, systemProgram: anchor.web3.SystemProgram.programId})
        .rpc();
      throw new Error("Expected transaction to fail but it succeeded");
    } catch (error: any) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "DepositTooSmall", "Should fail with  Deposit to small");
    }
    assert.strictEqual(flag, "Failed", "Depositing to locked vault should fail");
  });

  it("Fails if withdrawal is greater than 3 SOL", async () => {
    const largeWithdraw = new anchor.BN(6 * anchor.web3.LAMPORTS_PER_SOL);

    let flag = "This should fail";
    try {
      await program.methods.withdrawal(largeWithdraw)
        .accountsPartial({user: provider.wallet.publicKey, state: vaultState, vault, systemProgram: anchor.web3.SystemProgram.programId})
        .rpc();
      throw new Error("Expected transaction to fail but it succeeded");
    } catch (error: any) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "WithdrawalLimitExceeded", "Should fail with WithdrawalLimitExceeded error");
    }
    assert.strictEqual(flag, "Failed", "Withdrawing above 3 SOL should fail");
  });
});
