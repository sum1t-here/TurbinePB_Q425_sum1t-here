use anchor_lang::prelude::*;

declare_id!("Ed1iDKV8BVu6j6Dr1SM8CSRkCfbwtRNQ2ziY1uLzjYJ5");

#[program]
pub mod solana_counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
