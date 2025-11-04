use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{ Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked },
};

use crate::state::Escrow;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
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
    // Mint of Token B (token maker wants to receive)
    // ----------------------------------------
    #[account(mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>,

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
        init,
        payer = maker,
        seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        space = 8 + Escrow::INIT_SPACE,
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
        init,
        payer = maker,
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

impl<'info> Make<'info> {
    pub fn init_escrow(&mut self, seed: u64, receive: u64, bumps: &MakeBumps) -> Result<()> {
        self.escrow.set_inner(Escrow {
            seed,
            maker: self.maker.key(),
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            receive,
            bump: bumps.escrow,
        });

        Ok(())
    }

    pub fn deposit(&mut self, deposit: u64) -> Result<()> {
        let transfer_account = TransferChecked {
            from: self.maker_ata_a.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), transfer_account);

        transfer_checked(cpi_ctx, deposit, self.mint_a.decimals)?;
        Ok(())
    }
}
