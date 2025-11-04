use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        Mint,
        TokenAccount,
        TokenInterface,
        TransferChecked,
        transfer_checked,
        close_account,
        CloseAccount,
    },
};

use crate::state::Escrow;

#[derive(Accounts)]
pub struct Refund<'info> {
    // ----------------------------------------
    // The person who creates the escrow
    // ----------------------------------------
    #[account(mut)]
    pub maker: Signer<'info>,

    // ----------------------------------------
    // Mint of Token A (token offered by maker)
    // ----------------------------------------
    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>,

    // ----------------------------------------
    // Maker’s Associated Token Account (ATA) for Mint A
    // ----------------------------------------
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,
    // This is where maker currently holds their Mint A tokens.
    // Will be debited when locking into escrow.
    // `mut` — because tokens will move from here → vault.

    // ----------------------------------------
    // Escrow account (metadata PDA)
    // ----------------------------------------
    #[account(
        mut, 
        close = maker,
        has_one = mint_a,
        seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()], 
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    // PDA derived using “escrow” + maker pubkey + unique seed.
    // Stores escrow details: maker, mints, expected receive amount, etc.
    // Initialized and paid for by the maker.

    // ----------------------------------------
    // Vault ATA (where locked tokens will sit)
    // ----------------------------------------
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    // ATA owned by the escrow PDA.
    // This is where maker’s Mint A tokens are **locked safely** until trade completes.

    pub associated_token_program: Program<'info, AssociatedToken>, // Used to create ATAs
    pub token_program: Interface<'info, TokenInterface>, // SPL token program / Token-22 program
    pub system_program: Program<'info, System>, // Needed to create accounts, pay rent
}

impl<'info> Refund<'info> {
    pub fn refund_and_close(&mut self) -> Result<()> {
        let signer_seeds: [&[&[u8]]; 1] = [
            &[
                b"escrow",
                &self.maker.key.as_ref(),
                &self.escrow.seed.to_le_bytes()[..],
                &[self.escrow.bump],
            ],
        ];

        let transfer_account = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.maker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            transfer_account,
            &signer_seeds
        );

        transfer_checked(cpi_ctx, self.vault.amount, self.mint_a.decimals)?;

        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let close_cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            close_accounts,
            &signer_seeds
        );

        close_account(close_cpi_ctx)?;

        Ok(())
    }
}
