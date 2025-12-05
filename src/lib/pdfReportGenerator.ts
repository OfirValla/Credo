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

// Brand Colors
const COLORS = {
    primary: [79, 70, 229] as [number, number, number], // Indigo-600
    secondary: [20, 184, 166] as [number, number, number], // Teal-500
    text: {
        dark: [30, 41, 59] as [number, number, number], // Slate-800
        light: [100, 116, 139] as [number, number, number], // Slate-500
    },
    tables: {
        header: [79, 70, 229] as [number, number, number],
        alternate: [241, 245, 249] as [number, number, number], // Slate-100
    }
};

const FONT_FAMILY = 'Rubik';

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

// Helper to format currency/numbers
const formatWithCommas = (value: number) => Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});

const getCurrencySymbol = (code: CurrencyCode) => CURRENCIES.find(c => c.code === code)?.symbol || code;

const loadImage = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Failed to load image:', url, e);
        return null;
    }
};

const addCoverPage = async (doc: jsPDF, data: ReportData) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Background accent
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

    // Logo (Favicon)
    const logoData = await loadImage('/favicon.png');
    if (logoData) {
        try {
            doc.addImage(logoData, 'PNG', (pageWidth - 40) / 2, 50, 40, 40);
        } catch (e) {
            console.warn('Error adding logo to PDF', e);
        }
    }

    // Title
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(32);
    doc.setTextColor(COLORS.text.dark[0], COLORS.text.dark[1], COLORS.text.dark[2]);
    doc.text('Mortgage Report', pageWidth / 2, 110, { align: 'center' });

    // Subtitle / Summary
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.text.light[0], COLORS.text.light[1], COLORS.text.light[2]);

    const dateStr = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    doc.text(`Generated on ${dateStr}`, pageWidth / 2, 125, { align: 'center' });

    // Key stats circle/box
    const startStatsY = 160;
    doc.setFillColor(248, 250, 252); // Slate-50;
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.roundedRect(margin, startStatsY, pageWidth - (margin * 2), 60, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(COLORS.text.light[0], COLORS.text.light[1], COLORS.text.light[2]);
    doc.text('Total Balance', pageWidth / 2, startStatsY + 15, { align: 'center' });

    doc.setFontSize(24);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(`${formatWithCommas(data.summary.totalBalance)} ${getCurrencySymbol(data.currency)}`, pageWidth / 2, startStatsY + 28, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setTextColor(COLORS.text.light[0], COLORS.text.light[1], COLORS.text.light[2]);
    doc.text(`Monthly Payment: ${formatWithCommas(data.summary.monthlyPayment)} ${getCurrencySymbol(data.currency)}`, pageWidth / 2, startStatsY + 45, { align: 'center' });
};

const addTableOfContents = (doc: jsPDF, sections: string[]) => {
    doc.addPage();

    doc.setFontSize(24);
    doc.setTextColor(COLORS.text.dark[0], COLORS.text.dark[1], COLORS.text.dark[2]);
    doc.text('Table of Contents', margin, 30);

    doc.setFontSize(14);
    doc.setTextColor(COLORS.text.light[0], COLORS.text.light[1], COLORS.text.light[2]);

    let y = 50;
    sections.forEach((section, index) => {
        doc.text(`${index + 1}. ${section}`, margin + 10, y);
        y += 12;
    });
};

const margin = 14;

export const generatePDFReport = async (data: ReportData) => {
    const doc = new jsPDF();

    // Load fonts
    try {
        const fontBase64 = await loadHebrewFont();
        doc.addFileToVFS('Rubik-Regular.ttf', fontBase64);
        doc.addFont('Rubik-Regular.ttf', 'Rubik', 'normal');
        doc.setFont('Rubik');
    } catch (e) {
        console.warn('Could not load Hebrew font, falling back.', e);
    }

    // 1. Cover Page
    await addCoverPage(doc, data);

    // 2. Table of Contents
    const sections = [
        'Portfolio Summary',
        'Plans Breakdown'
    ];
    if (data.extraPayments?.length) sections.push('Extra Payments');
    if (data.rateChanges?.length) sections.push('Rate Changes');
    if (data.gracePeriods?.length) sections.push('Grace Periods');
    sections.push('Amortization Schedule');

    addTableOfContents(doc, sections);

    // 3. Content Pages
    doc.addPage();
    let yPos = 20;

    // --- Portfolio Summary ---
    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('1. Portfolio Summary', margin, yPos);

    yPos += 10;
    const summaryData = [
        ['Total Balance', formatWithCommas(data.summary.totalBalance)],
        ['Monthly Payment', formatWithCommas(data.summary.monthlyPayment)],
        ['Total Interest', formatWithCommas(data.summary.totalInterest)],
        ['Currency', `${data.currency} (${getCurrencySymbol(data.currency)})`],
        ['Projected Payoff', data.summary.payoffDate]
    ];

    autoTable(doc, {
        startY: yPos,
        body: summaryData,
        theme: 'plain',
        styles: {
            fontSize: 11,
            cellPadding: 4,
            font: FONT_FAMILY,
            textColor: COLORS.text.dark,
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60, textColor: COLORS.primary },
            1: { cellWidth: 60 }
        },
        margin: { left: margin }
    });

    // --- Plans Breakdown ---
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 20;

    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('2. Plans Breakdown', margin, yPos);
    yPos += 10;

    const plansBody = data.plans.map(plan => {
        const { totalMonths } = getPlanDurationInfo(plan);
        const years = (totalMonths / 12).toFixed(1);
        return [
            processText(plan.name || `Plan ${plan.id}`),
            formatWithCommas(plan.amount),
            `${data.currency} (${getCurrencySymbol(data.currency)})`,
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
            fillColor: COLORS.tables.header,
            font: FONT_FAMILY,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            font: FONT_FAMILY,
            cellPadding: 4
        },
        alternateRowStyles: {
            fillColor: COLORS.tables.alternate
        },
        margin: { left: margin }
    });

    let sectionIndex = 3;

    // --- Extra Payments ---
    if (data.extraPayments && data.extraPayments.length > 0) {
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 20;

        // Check if we need a new page
        if (yPos > doc.internal.pageSize.height - 40) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(18);
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.text(`${sectionIndex}. Extra Payments`, margin, yPos);
        sectionIndex++;
        yPos += 10;

        const extraPaymentsBody = data.extraPayments.map(payment => [
            processText(data.plans.find(p => p.id === payment.planId)?.name || `Plan ${payment.planId}`),
            payment.month,
            formatWithCommas(payment.amount),
            `${data.currency} (${getCurrencySymbol(data.currency)})`,
            payment.type === 'reduceTerm' ? 'Reduce Term' : 'Reduce Payment'
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Plan Name', 'Date', 'Amount', 'Currency', 'Type']],
            body: extraPaymentsBody,
            theme: 'striped',
            headStyles: {
                fillColor: COLORS.secondary,
                font: FONT_FAMILY
            },
            styles: {
                fontSize: 10,
                font: FONT_FAMILY
            },
            alternateRowStyles: {
                fillColor: COLORS.tables.alternate
            },
            margin: { left: margin }
        });
    }

    // --- Rate Changes ---
    if (data.rateChanges && data.rateChanges.length > 0) {
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 20;
        if (yPos > doc.internal.pageSize.height - 40) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(18);
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.text(`${sectionIndex}. Rate Changes`, margin, yPos);
        sectionIndex++;
        yPos += 10;

        const rateChangesBody = data.rateChanges.map(change => [
            processText(data.plans.find(p => p.id === change.planId)?.name || `Plan ${change.planId}`),
            change.month,
            `${change.newAnnualRate}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Plan Name', 'Date', 'New Rate']],
            body: rateChangesBody,
            theme: 'striped',
            headStyles: {
                fillColor: COLORS.secondary,
                font: FONT_FAMILY
            },
            styles: {
                fontSize: 10,
                font: FONT_FAMILY
            },
            alternateRowStyles: {
                fillColor: COLORS.tables.alternate
            },
            margin: { left: margin }
        });
    }

    // --- Grace Periods ---
    if (data.gracePeriods && data.gracePeriods.length > 0) {
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 20;
        if (yPos > doc.internal.pageSize.height - 40) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(18);
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.text(`${sectionIndex}. Grace Periods`, margin, yPos);
        sectionIndex++;
        yPos += 10;

        const gracePeriodsBody = data.gracePeriods.map(grace => [
            processText(data.plans.find(p => p.id === grace.planId)?.name || `Plan ${grace.planId}`),
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
                fillColor: COLORS.secondary,
                font: FONT_FAMILY
            },
            styles: {
                fontSize: 10,
                font: FONT_FAMILY
            },
            alternateRowStyles: {
                fillColor: COLORS.tables.alternate
            },
            margin: { left: margin }
        });
    }

    // --- Amortization Schedule ---
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 25;

    // Always start schedule on new page if space is low, but usually we just add page if needed
    if (yPos > doc.internal.pageSize.height - 60) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(`${sectionIndex}. Amortization Schedule`, margin, yPos);
    yPos += 10;

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
            fillColor: COLORS.primary,
            font: FONT_FAMILY
        },
        styles: {
            fontSize: 9,
            halign: 'right',
            font: FONT_FAMILY,
            cellPadding: 3
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' }
        },
        margin: { left: margin }
    });

    // Add footer page numbers
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        if (i === 1) continue; // No page number on cover
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save('mortgage_manager_report.pdf');
};
