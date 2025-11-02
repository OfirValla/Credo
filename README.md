# Mortgage Manager

A comprehensive React + TypeScript application for managing multiple mortgage plans and extra payments with detailed amortization calculations.

## Features

- **Multiple Mortgage Plans**: Add and manage multiple mortgage plans simultaneously
- **Extra Payments**: Schedule extra payments with options to reduce term or reduce monthly payment
- **Dynamic Amortization Tables**: Automatically calculates full amortization schedules
- **Summary Analytics**: Compare totals with and without extra payments, showing savings
- **Modern UI**: Built with shadcn/ui components for a beautiful, responsive interface

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Usage

1. **Add Mortgage Plans**: Enter the initial amount, annual rate (%), term in months, and start date (MM/YYYY format)
2. **Add Extra Payments**: Schedule extra payments for specific months, choosing to either reduce the term or reduce future monthly payments
3. **View Amortization Table**: See the complete month-by-month breakdown of all plans
4. **Review Summary**: Compare total payments, interest, and savings with/without extra payments

## Project Structure

```
mortgage-manager/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── MortgageForm.tsx
│   │   ├── ExtraPaymentsForm.tsx
│   │   ├── AmortizationTable.tsx
│   │   └── MortgageSummary.tsx
│   ├── hooks/
│   │   └── useMortgage.ts    # Amortization calculation logic
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Calculation Details

The application uses the standard PMT (Payment) formula for mortgage calculations:

```
PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
```

Where:
- P = Principal amount
- r = Monthly interest rate (annual rate / 100 / 12)
- n = Number of payments

Extra payments can be applied in two ways:
- **Reduce Term**: Extra payment reduces principal, shortening the loan term
- **Reduce Payment**: Extra payment reduces principal and recalculates the monthly payment for the remaining term
