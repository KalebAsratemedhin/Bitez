export interface PaymentInitInput {
  amount: number;
  email: string;
  firstName: string;
  phoneNumber: string;
  txRef: string;
  returnUrl: string;
}

export interface PaymentInitResult {
  success: boolean;
  checkoutUrl?: string;
  message?: string;
}

export interface IPaymentGateway {
  initializePayment(input: PaymentInitInput): Promise<PaymentInitResult>;
}
