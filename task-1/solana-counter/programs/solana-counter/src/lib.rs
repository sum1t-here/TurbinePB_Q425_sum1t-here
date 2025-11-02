use anchor_lang::prelude::*;

declare_id!("Ed1iDKV8BVu6j6Dr1SM8CSRkCfbwtRNQ2ziY1uLzjYJ5");

#[program]
pub mod solana_counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = *ctx.accounts.authority.key;
        Ok(())
    }

    pub fn increment(ctx: Context<Modify>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1).ok_or(error!(CounterError::Overflow))?;
        Ok(())
    }

    pub fn decrement(ctx: Context<Modify>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_sub(1).ok_or(error!(CounterError::Underflow))?;
        Ok(())
    }

    pub fn reset(ctx: Context<Reset>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        // only authority can reset
        require_keys_eq!(
            counter.authority,
            ctx.accounts.authority.key(),
            CounterError::Unauthorized
        );
        counter.count = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + Counter::LEN)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Modify<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Reset<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub count: u32,
    pub authority: Pubkey,
}

impl Counter {
    // size calc: u64 (8) + Pubkey (32)
    pub const LEN: usize = 8 + 32;
}

#[error_code]
pub enum CounterError {
    #[msg("Counter overflow")]
    Overflow,
    #[msg("Counter underflow")]
    Underflow,
    #[msg("Unauthorized")]
    Unauthorized,
}
