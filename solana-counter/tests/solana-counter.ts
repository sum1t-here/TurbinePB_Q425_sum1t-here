import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaCounter } from "../target/types/solana_counter";
import {assert} from "chai";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";

describe("solana-counter", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaCounter as Program<SolanaCounter>;

  // generate a new counter account keypair
  const counter = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    // it initializes the counter
    await program.methods.initialize().accounts({
      counter: counter.publicKey,
      authority: provider.wallet.publicKey,
    })
    .signers([counter])
    .rpc();

    const account = await program.account.counter.fetch(counter.publicKey);
    assert.equal(Number(account.count), 0);
    assert.ok(account.authority.equals(provider.wallet.publicKey));
  
    console.log("Counter Initialized:", Number(account.count));
  });

  it("Increments the counter", async () => {
    await program.methods.increment().accounts({
      counter: counter.publicKey,
      authority: provider.wallet.publicKey,
    })
    .rpc();

    const account = await program.account.counter.fetch(counter.publicKey);
    assert.equal(Number(account.count), 1);

    console.log("Counter after increment", Number(account.count));
  });

  it("Decrements the counter", async () => {
    await program.methods.decrement().accounts({
      counter: counter.publicKey,
      authority: provider.publicKey,
    })
    .rpc();

    const account = await program.account.counter.fetch(counter.publicKey);
    assert.equal(Number(account.count), 0);

    console.log("Counter after decrement:", Number(account.count));
  });

  it("Resets the counter only by authority", async () => {
    await program.methods
      .increment()
      .accounts({
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

      await program.methods
      .reset()
      .accounts({
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

      const account = await program.account.counter.fetch(counter.publicKey);
      assert.equal(Number(account.count), 0);

      console.log("Counter after reset:", Number(account.count));
  });

  it("Reset should fail if done by non-authority", async () => {
    const fakeAuthority = anchor.web3.Keypair.generate();

    try {
      await program.methods
        .reset()
        .accounts({
          counter: counter.publicKey,
          authority: fakeAuthority.publicKey,
        })
        .signers([fakeAuthority])
        .rpc();
      assert.fail("Reset should have failed for non-authority");
    } catch (err) {
      assert.include(err.toString(), "Unauthorized");
      console.log("Reset failed as expected for non-authority");
    }
  })
});
