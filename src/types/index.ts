import { CurrencyCode } from "@/lib/currency";

export interface Plan {
  id: string;
  name?: string; // Optional custom name for the plan
  amount: number;
  interestRate: number; // percentage (e.g., 5.5 for 5.5%)
  takenDate: string; // DD/MM/YYYY format
  firstPaymentDate: string; // DD/MM/YYYY format
  lastPaymentDate: string; // DD/MM/YYYY format
  gracePeriodType?: GracePeriodType; // Optional, defaults to 'capitalized'
  enabled?: boolean; // Optional, defaults to true
  linkedToCPI?: boolean; // Optional, defaults to false
  remainingMonths?: number; // Calculated field
  balloonValue?: number; // Optional balloon amount to remain at end of term
  type?: LoanType; // Optional type
}

export interface ExtraPayment {
  id: string;
  month: string; // MM/YYYY format
  planId: string;
  amount: number;
  type: ExtraPaymentType;
  enabled?: boolean; // Optional, defaults to true
}

export interface GracePeriod {
  id: string;
  planId: string;
  startDate: string; // MM/YYYY format
  endDate: string; // MM/YYYY format
  type: GracePeriodType;
  enabled?: boolean; // Optional, defaults to true
}

export interface RateChange {
  id: string;
  month: string; // MM/YYYY format
  planId: string;
  newAnnualRate: number; // percentage (e.g., 5.5 for 5.5%)
  enabled?: boolean; // Optional, defaults to true
}

export interface RowTag {
  type: 'grace-period' | 'extra-payment' | 'rate-change';
  label: string;
  color?: string; // Optional override
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
  tags?: RowTag[];
  isGracePeriod?: boolean;
  linkage?: number;
}

export interface Portfolio {
  id: string;
  type: PortfolioType;
  name: string;
  createdAt: number;
  color?: string;
  icon?: string;
}

export enum PortfolioType {
  MORTGAGE = 'mortgage',
  LOAN = 'loan',
}

export enum LoanType {
  REGULAR = 'regular',
  BALLOON = 'balloon',
}

export enum GracePeriodType {
  CAPITALIZED = 'capitalized',
  INTEREST_ONLY = 'interestOnly',
}

export enum ExtraPaymentType {
  REDUCE_TERM = 'reduceTerm',
  REDUCE_PAYMENT = 'reducePayment',
}

export interface ExportPortfolio {
  portfolio: Portfolio;
  currency: CurrencyCode;
  plans: Plan[];
  extraPayments: ExtraPayment[];
  rateChanges: RateChange[];
  gracePeriods: GracePeriod[];
}