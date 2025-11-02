use anchor_lang::{ prelude::*, system_program::{ Transfer, transfer } };

declare_id!("AwFnaY3xnDaG6MX1JZfpkrTgU8uS12nX4HAMpFz5u4a9");

#[program]
pub mod vault_savings {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        ctx.accounts.initialize(amount, &ctx.bumps)?;

        Ok(())
    }

    pub fn deposit(ctx: Context<Operations>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)?;

        Ok(())
    }

    pub fn withdrawal(ctx: Context<Operations>, amount: u64) -> Result<()> {
        ctx.accounts.withdrawal(amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // ----------------------------
    // PDA 1: VaultState (Metadata)
    // ----------------------------
    // A PDA that stores how much user wants to lock
    // and the bump values for reproducibility.
    #[account(
        init, // Create this account
        payer = user, // User funds its creation
        seeds = [b"state".as_ref(), user.key().as_ref()], // Seed = "state" + user pubkey
        bump, // Anchor finds bump automatically
        space = VaultState::INIT_SPACE // Allocate required bytes
    )]
    pub state: Account<'info, VaultState>,

    // ----------------------------
    // PDA 2: Vault (Funds Holder)
    // ----------------------------
    // A derived address that will "own" and hold SOL.
    // It's not initialized here (SystemAccount means already exists or rent exempted)
    #[account(
        seeds = [b"vault".as_ref(), state.key().as_ref()],
        bump
    )] // Seed = "vault" + state pubkey
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

// This is *not* a separate Solana instruction.
// It's just a helper that writes values into the state account
// after Anchor has created it.
impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, amount: u64, bumps: &InitializeBumps) -> Result<()> {
        // Save the deposit or lock amount.
        self.state.amount = amount;
        // Save the PDA bump for vault (so we can re-derive PDA later).
        self.state.vault_bump = bumps.vault;
        // Save the PDA bump for state (so we can re-derive PDA later).
        self.state.state_bump = bumps.state;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Operations<'info> {
    #[account(mut)]
    pub user: Signer<'info>, // The user who deposits or withdraws funds

    // The user's vault PDA (stores SOL)
    // ❗ Notice that `vault` is a PDA derived using the same seeds as before
    #[account(
        mut, 
        seeds = [b"vault".as_ref(), state.key().as_ref()],
        bump = state.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    // The vault’s metadata account
    #[account(seeds = [b"state".as_ref(), user.key().as_ref()], bump = state.state_bump)]
    pub state: Account<'info, VaultState>,
    pub system_program: Program<'info, System>,
}

impl<'info> Operations<'info> {
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        const MIN_DEPOSIT: u64 = 1_000_000_000;

        require!(amount > MIN_DEPOSIT, VaultError::DepositTooSmall);

        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.user.to_account_info(),
            to: self.vault.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer(cpi_ctx, amount)?;

        self.check_balance()?;

        Ok(())
    }
    // If vault balance >= required lock amount, refund or trigger logic
    pub fn check_balance(&mut self) -> Result<()> {
        if self.vault.lamports() >= self.state.amount {
            let cpi_program = self.system_program.to_account_info();

            let cpi_accounts = Transfer {
                from: self.vault.to_account_info(),
                to: self.user.to_account_info(),
            };

            // PDA seeds used for vault:
            // "vault" + state_pubkey + [vault_bump]
            // The bump ensures the derived PDA is the same one that owns the vault.
            let seeds = &[
                b"vault".as_ref(),
                self.state.to_account_info().key.as_ref(),
                &[self.state.vault_bump],
            ];

            let signer_seeds = &[&seeds[..]];

            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

            transfer(cpi_ctx, self.vault.lamports())?;
        }

        Ok(())
    }

    pub fn withdrawal(&mut self, amount: u64) -> Result<()> {
        const MAX_WITHDRAW: u64 = 3_000_000_000; // 3 SOL

        require!(amount <= MAX_WITHDRAW, VaultError::WithdrawalLimitExceeded);

        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };

        // passing from vaults to signer
        // so our program must be able to sig on behalf of PDA

        let seeds = &[
            b"vault".as_ref(),
            self.state.to_account_info().key.as_ref(),
            &[self.state.vault_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer(cpi_ctx, amount)?;

        Ok(())
    }
}

#[account]
pub struct VaultState {
    pub amount: u64,
    pub vault_bump: u8,
    pub state_bump: u8,
}

impl Space for VaultState {
    const INIT_SPACE: usize = 8 + 8 + 1 + 1;
}

#[error_code]
pub enum VaultError {
    #[msg("Deposit amount must be greater than 1 SOL")]
    DepositTooSmall,
    #[msg("You cannot withdraw more than 3 SOL at once")]
    WithdrawalLimitExceeded,
}
