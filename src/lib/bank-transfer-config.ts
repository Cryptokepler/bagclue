// Bank transfer configuration helpers
// Created: 2026-05-06 (PAYMENTS MVP.2A)
// Security: NEVER log CLABE or account numbers

import type { BankTransferConfig } from '@/types/payment';

/**
 * Get bank transfer configuration from environment variables
 * Returns null if required variables are missing
 * SECURITY: Does NOT log sensitive data (CLABE, account number)
 */
export function getBankTransferConfig(): BankTransferConfig | null {
  const bankName = process.env.BANK_NAME;
  const accountHolder = process.env.BANK_ACCOUNT_HOLDER;
  const clabe = process.env.BANK_CLABE;
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER;
  const paymentInstructions = process.env.BANK_PAYMENT_INSTRUCTIONS;

  // Validate required fields
  if (!bankName || !accountHolder || !clabe) {
    return null;
  }

  return {
    bankName,
    accountHolder,
    clabe,
    accountNumber,
    paymentInstructions,
  };
}

/**
 * Validate that bank transfer configuration is complete
 * Returns true if all required env vars are present
 */
export function validateBankTransferConfig(): boolean {
  const config = getBankTransferConfig();
  return config !== null;
}

/**
 * Build a unique payment reference for bank transfers
 * Format: BGCL-{timestamp}-{randomSuffix}
 * Example: BGCL-1778098123456-A7F9
 */
export function buildPaymentReference(): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BGCL-${timestamp}-${randomSuffix}`;
}

/**
 * Safe logging helper - logs config availability without exposing sensitive data
 * Use this instead of logging the full config object
 */
export function logBankConfigStatus(): void {
  const config = getBankTransferConfig();
  if (config) {
    console.log('[BankTransfer] Config available:', {
      hasBankName: !!config.bankName,
      hasAccountHolder: !!config.accountHolder,
      hasCLABE: !!config.clabe,
      hasAccountNumber: !!config.accountNumber,
      hasInstructions: !!config.paymentInstructions,
      // NEVER log actual values
    });
  } else {
    console.warn('[BankTransfer] Config MISSING - required env vars not set');
  }
}
