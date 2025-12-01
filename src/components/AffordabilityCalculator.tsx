import { useState, useEffect } from 'react';
import { DollarSign, Percent, Wallet, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/currency';
import { useMortgage } from '@/context/MortgageProvider';

export function AffordabilityCalculator() {
    const { currency } = useMortgage();

    // Inputs
    const [monthlyIncome, setMonthlyIncome] = useState<number>(15000);
    const [monthlyDebts, setMonthlyDebts] = useState<number>(2000);
    const [downPayment, setDownPayment] = useState<number>(400000);
    const [interestRate, setInterestRate] = useState<number>(4.5);
    const [loanTermYears, setLoanTermYears] = useState<number>(30);
    const [dtiRatio, setDtiRatio] = useState<number>(35); // Debt-to-Income ratio in %

    // Outputs
    const [maxMonthlyPayment, setMaxMonthlyPayment] = useState<number>(0);
    const [maxLoanAmount, setMaxLoanAmount] = useState<number>(0);
    const [maxHomePrice, setMaxHomePrice] = useState<number>(0);

    useEffect(() => {
        // 1. Calculate Max Monthly Payment allowed
        // Formula: (Gross Income * DTI) - Debts
        // Note: Usually DTI is on Gross, but here we might assume Net or let user decide. 
        // We'll treat input as "Income available for DTI calc".
        const maxPayment = (monthlyIncome * (dtiRatio / 100)) - monthlyDebts;
        const safeMaxPayment = Math.max(0, maxPayment);
        setMaxMonthlyPayment(safeMaxPayment);

        // 2. Calculate Max Loan Amount
        // PV = PMT * (1 - (1 + r)^-n) / r
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTermYears * 12;

        let loanAmount = 0;
        if (monthlyRate > 0) {
            loanAmount = safeMaxPayment * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
        } else {
            loanAmount = safeMaxPayment * numPayments;
        }
        setMaxLoanAmount(loanAmount);

        // 3. Max Home Price
        setMaxHomePrice(loanAmount + downPayment);

    }, [monthlyIncome, monthlyDebts, downPayment, interestRate, loanTermYears, dtiRatio]);

    return (
        <Card className="w-full border-primary/20 bg-gradient-to-br from-card/50 to-background backdrop-blur-sm shadow-xl overflow-hidden relative">
            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 transform -translate-x-1/2 -translate-y-1/2" />

            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl border border-blue-500/10 shadow-sm">
                        <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Affordability Calculator</CardTitle>
                        <CardDescription>Estimate your purchasing power</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-8">

                {/* Results Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-sm">
                        <CardContent className="pt-6 text-center">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Max Home Price</p>
                            <div className="text-2xl font-bold text-primary">
                                {formatCurrency(maxHomePrice, currency)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50 shadow-sm">
                        <CardContent className="pt-6 text-center">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Max Loan Amount</p>
                            <div className="text-xl font-semibold">
                                {formatCurrency(maxLoanAmount, currency)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50 shadow-sm">
                        <CardContent className="pt-6 text-center">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Max Monthly Payment</p>
                            <div className="text-xl font-semibold">
                                {formatCurrency(maxMonthlyPayment, currency)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Inputs Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                Monthly Net Income
                            </Label>
                            <Input
                                type="number"
                                value={monthlyIncome}
                                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                Monthly Debts
                            </Label>
                            <Input
                                type="number"
                                value={monthlyDebts}
                                onChange={(e) => setMonthlyDebts(Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">Loans, credit cards, alimony, etc.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                Down Payment
                            </Label>
                            <Input
                                type="number"
                                value={downPayment}
                                onChange={(e) => setDownPayment(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Percent className="w-4 h-4 text-muted-foreground" />
                                Interest Rate (%)
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                Loan Term (Years)
                            </Label>
                            <div className="pt-2">
                                <Slider
                                    value={[loanTermYears]}
                                    min={5}
                                    max={30}
                                    step={1}
                                    onValueChange={(vals: number[]) => setLoanTermYears(vals[0])}
                                />
                                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                    <span>5y</span>
                                    <span className="font-medium text-foreground">{loanTermYears} Years</span>
                                    <span>30y</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Percent className="w-4 h-4 text-muted-foreground" />
                                Max DTI Ratio (%)
                            </Label>
                            <div className="pt-2">
                                <Slider
                                    value={[dtiRatio]}
                                    min={10}
                                    max={50}
                                    step={1}
                                    onValueChange={(vals: number[]) => setDtiRatio(vals[0])}
                                />
                                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                    <span>Conservative (20%)</span>
                                    <span className="font-medium text-foreground">{dtiRatio}%</span>
                                    <span>Aggressive (50%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
