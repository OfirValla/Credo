export interface MortgagePlan {
  id: string;
  name?: string; // Optional custom name for the plan
  amount: number;
  interestRate: number; // percentage (e.g., 5.5 for 5.5%)
  takenDate: string; // DD/MM/YYYY format
  firstPaymentDate: string; // DD/MM/YYYY format
  lastPaymentDate: string; // DD/MM/YYYY format
}

export interface ExtraPayment {
  id: string;
  month: string; // MM/YYYY format
  planId: string;
  amount: number;
  type: "reduceTerm" | "reducePayment";
}

export interface RateChange {
  id: string;
  month: string; // MM/YYYY format
  planId: string;
  newAnnualRate: number; // percentage (e.g., 5.5 for 5.5%)
}

export interface AmortizationRow {
  month: string; // MM/YYYY format
  planId: string;
  startingBalance: number;
  monthlyRate: number;
  monthlyPayment: number;
  principal: number;
  interest: number;
  endingBalance: number;
}
