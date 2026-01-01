# Credo

A comprehensive financial management application for planning, tracking, and optimizing mortgage and loan portfolios.

## Features

### 📊 Portfolio Management
- **Multiple Portfolios**: Create and manage distinct mortgage or loan portfolios side-by-side.
- **Smart Dashboard**: Get a high-level overview of total balance, monthly commitments, and active plans.
- **Customization**: Assign unique colors and icons to each portfolio for easy identification.

### 🧮 Advanced Planning & Calculations
- **Detailed Amortization**: View complete month-by-month amortization schedules.
- **Extra Payments**: Model one-time or recurring extra payments to see impact on term or monthly payments.
- **Rate Changes**: Schedule future interest rate changes to forecast payment fluctuations.
- **Grace Periods**: Handle partial or full grace periods (interest-only or deferred payments).
- **CPI Linkage**: Robust support for inflation-linked loans with CPI adjustments.

### 🌍 Global Settings
- **Multi-Currency**: Support for ILS, USD, EUR, and GBP.
- **Internationalization**: Fully localized interface in English and Hebrew.
- **Theme Support**: Seamless Light and Dark mode switching.

### 💾 Data Control
- **Local Privacy**: All data is stored locally in your browser – no external servers.
- **Import/Export**: Easily backup or share your portfolios via JSON import/export.
- **Clear Cache**: Quick options to reset data when needed.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS** + **Shadcn/UI**
- **Recharts** for visualization
- **i18next** for localization

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

## Calculation Details

The application uses standard financial formulas extended for Israeli mortgage specifics (CPI linkage, Grace periods):

### PMT Formula
```
PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
```
Where:
- P = Principal amount
- r = Monthly interest rate
- n = Number of payments

### Extra Payments Strategies
- **Reduce Term**: Extra payment reduces principal, shortening the loan term.
- **Reduce Payment**: Extra payment reduces principal and recalculates the monthly payment for the remaining term.
