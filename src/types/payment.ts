// Payment types for bank transfer system
// Created: 2026-05-06 (PAYMENTS MVP.2A)

export interface BankTransferConfig {
  bankName: string;
  accountHolder: string;
  clabe: string;
  accountNumber?: string;
  paymentInstructions?: string;
}

export interface CreateBankOrderRequest {
  productId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface CreateBankOrderResponse {
  orderId: string;
  transactionId: string;
  trackingToken: string;
  paymentReference: string;
  amountMxn: number;
  expiresAt: string;
  bankConfig: BankTransferConfig;
}

export interface UploadProofRequest {
  transactionId: string;
  file: File;
}

export interface UploadProofResponse {
  success: boolean;
  message: string;
  proofUrl?: string;
}

export interface VerifyPaymentRequest {
  transactionId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  orderId?: string;
  transactionStatus?: string;
}

export interface BankConfigResponse {
  bankConfig: BankTransferConfig;
}
