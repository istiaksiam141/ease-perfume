import { PaymentMethod, PaymentStatus } from "@prisma/client";

export type PaymentInitialization = { method: PaymentMethod; status: PaymentStatus };
export interface PaymentProvider {
  readonly method: PaymentMethod;
  initialize(amount: number): PaymentInitialization;
}

// Keep payment-specific setup behind this provider contract. Add a gateway provider
// and its webhook flow here later; order validation and inventory remain unchanged.
export const cashOnDeliveryProvider: PaymentProvider = {
  method: PaymentMethod.COD,
  initialize: (_amount) => ({ method: PaymentMethod.COD, status: PaymentStatus.UNPAID })
};

export function paymentProvider(method: PaymentMethod): PaymentProvider {
  if (method === PaymentMethod.COD) return cashOnDeliveryProvider;
  throw new Error("Payment method is not configured.");
}
