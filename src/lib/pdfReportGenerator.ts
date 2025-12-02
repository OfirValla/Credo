import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MortgagePlan, AmortizationRow, ExtraPayment, RateChange, GracePeriod } from '@/types';
import { CurrencyCode, CURRENCIES } from '@/lib/currency';
import { getPlanDurationInfo } from '@/lib/planUtils';
import { loadHebrewFont } from '@/lib/fontLoader';

interface ReportData {
    plans: MortgagePlan[];
    extraPayments: ExtraPayment[];
    rateChanges: RateChange[];
    gracePeriods: GracePeriod[];
    amortizationSchedule: AmortizationRow[];
    currency: CurrencyCode;
    summary: {
        totalBalance: number;
        monthlyPayment: number;
        totalInterest: number;
        payoffDate: string;
    };
}

export const generatePDFReport = async (data: ReportData) => {
    const doc = new jsPDF();
    const margin = 14;

    // Load and add Hebrew font
    try {
        const fontBase64 = await loadHebrewFont();
        doc.addFileToVFS('Rubik-Regular.ttf', fontBase64);
        doc.addFont('Rubik-Regular.ttf', 'Rubik', 'normal');
        doc.setFont('Rubik');
    } catch (e) {
        console.warn('Could not load Hebrew font, falling back to default.', e);
    }

    const formatWithCommas = (value: number) => Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    // Helper to check for Hebrew text
    const isHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);

    // Helper to reverse Hebrew text for RTL display in LTR context
    const processText = (text: string | number | undefined) => {
        if (!text) return '';
        const str = String(text);
        if (isHebrew(str)) {
            return str.split('').reverse().join('');
        }
        return str;
    };

    // Helper to get plan name
    const getPlanName = (planId: string) => {
        const plan = data.plans.find(p => p.id === planId);
        return processText(plan?.name || `Plan ${planId}`);
    };

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('Mortgage Manager Report', margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Generated on: ${dateStr}`, margin, 26);

    // --- Portfolio Summary ---
    let yPos = 40;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Portfolio Summary', margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const summaryData = [
        ['Total Balance', formatWithCommas(data.summary.totalBalance)],
        ['Monthly Payment', formatWithCommas(data.summary.monthlyPayment)],
        ['Total Interest', formatWithCommas(data.summary.totalInterest)],
        ['Currency', `${data.currency} (${CURRENCIES.find(c => c.code === data.currency)?.symbol})`],
        ['Projected Payoff', data.summary.payoffDate]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: summaryData,
        theme: 'plain',
        styles: {
            fontSize: 10,
            cellPadding: 2,
            font: 'Rubik'
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 50 }
        },
        margin: { left: margin }
    });

    // --- Plans Breakdown ---
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Plans Breakdown', margin, yPos);

    yPos += 5;
    const plansBody = data.plans.map(plan => {
        const { totalMonths } = getPlanDurationInfo(plan);
        const years = (totalMonths / 12).toFixed(1);
        return [
            processText(plan.name || `Plan ${plan.id}`),
            formatWithCommas(plan.amount),
            `${data.currency} (${CURRENCIES.find(c => c.code === data.currency)?.symbol})`,
            `${plan.interestRate}%`,
            `${years} years`
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Plan Name', 'Amount', 'Currency', 'Rate', 'Term']],
        body: plansBody,
        theme: 'striped',
        headStyles: {
            fillColor: [66, 66, 66],
            font: 'Rubik'
        },
        styles: {
            fontSize: 10,
            font: 'Rubik'
        },
        margin: { left: margin }
    });

    // --- Extra Payments ---
    if (data.extraPayments && data.extraPayments.length > 0) {
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Extra Payments', margin, yPos);

        yPos += 5;
        const extraPaymentsBody = data.extraPayments.map(payment => [
            getPlanName(payment.planId),
            payment.month,
            formatWithCommas(payment.amount),
            `${data.currency} (${CURRENCIES.find(c => c.code === data.currency)?.symbol})`,
            payment.type === 'reduceTerm' ? 'Reduce Term' : 'Reduce Payment'
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Plan Name', 'Date', 'Amount', 'Currency', 'Type']],
            body: extraPaymentsBody,
            theme: 'striped',
            headStyles: {
                fillColor: [46, 125, 50], // Green shade
                font: 'Rubik'
            },
            styles: {
                fontSize: 10,
                font: 'Rubik'
            },
            margin: { left: margin }
        });
    }

    // --- Rate Changes ---
    if (data.rateChanges && data.rateChanges.length > 0) {
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Rate Changes', margin, yPos);

        yPos += 5;
        const rateChangesBody = data.rateChanges.map(change => [
            getPlanName(change.planId),
            change.month,
            `${change.newAnnualRate}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Plan Name', 'Date', 'New Rate']],
            body: rateChangesBody,
            theme: 'striped',
            headStyles: {
                fillColor: [230, 81, 0], // Orange shade
                font: 'Rubik'
            },
            styles: {
                fontSize: 10,
                font: 'Rubik'
            },
            margin: { left: margin }
        });
    }

    // --- Grace Periods ---
    if (data.gracePeriods && data.gracePeriods.length > 0) {
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Grace Periods', margin, yPos);

        yPos += 5;
        const gracePeriodsBody = data.gracePeriods.map(grace => [
            getPlanName(grace.planId),
            grace.startDate,
            grace.endDate,
            grace.type === 'interestOnly' ? 'Interest Only' : 'Capitalized'
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Plan Name', 'Start Date', 'End Date', 'Type']],
            body: gracePeriodsBody,
            theme: 'striped',
            headStyles: {
                fillColor: [103, 58, 183], // Purple shade
                font: 'Rubik'
            },
            styles: {
                fontSize: 10,
                font: 'Rubik'
            },
            margin: { left: margin }
        });
    }

    // --- Amortization Schedule ---
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Amortization Schedule', margin, yPos);

    yPos += 5;
    const scheduleBody = data.amortizationSchedule.map(row => [
        row.month,
        processText(data.plans.find(p => p.id === row.planId)?.name || `Plan ${row.planId}`),
        formatWithCommas(row.monthlyPayment),
        formatWithCommas(row.principal),
        formatWithCommas(row.interest),
        formatWithCommas(row.endingBalance)
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Month', 'Plan Name', 'Payment', 'Principal', 'Interest', 'Balance']],
        body: scheduleBody,
        theme: 'grid',
        headStyles: {
            fillColor: [41, 128, 185],
            font: 'Rubik'
        },
        styles: {
            fontSize: 9,
            halign: 'right',
            font: 'Rubik'
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' }
        },
        margin: { left: margin }
    });

    // Save
    doc.save('mortgage_manager_report.pdf');
};
