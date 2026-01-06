import { Registration, EventQuestion } from '@/types';
import * as XLSX from 'xlsx';

interface ExportOptions {
    registrations: Registration[];
    questions: EventQuestion[];
    eventTitle: string;
}

/**
 * Export registrations with their responses to an Excel file
 */
export function exportResponsesToExcel({
    registrations,
    questions,
    eventTitle,
}: ExportOptions): void {
    // Sort questions by order
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

    // Build the data rows
    const rows = registrations.map((registration) => {
        const baseData: Record<string, string> = {
            'Name': registration.userName,
            'Email': registration.userEmail,
            'Status': registration.status.replace('_', ' '),
            'Registered At': new Date(registration.registrationTime).toLocaleString(),
            'University Email': registration.universityEmail || '',
            'Student ID': registration.studentId || '',
            'Registration Reason': registration.reason || '',
        };

        // Add dynamic question responses
        sortedQuestions.forEach((question) => {
            const response = registration.responses?.find(
                (r) => r.questionId === question.id
            );

            if (response) {
                if (Array.isArray(response.value)) {
                    baseData[question.label] = response.value.join(', ');
                } else {
                    baseData[question.label] = response.value || '';
                }
            } else {
                baseData[question.label] = '';
            }
        });

        return baseData;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    // Auto-size columns
    const maxWidth = 50;
    const colWidths: { wch: number }[] = [];

    if (rows.length > 0) {
        Object.keys(rows[0]).forEach((key) => {
            const maxContentWidth = Math.max(
                key.length,
                ...rows.map((row) => (row[key] || '').toString().length)
            );
            colWidths.push({ wch: Math.min(maxContentWidth + 2, maxWidth) });
        });
    }
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    const safeTitle = eventTitle.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeTitle || 'Registrations');

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_registrations_${date}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
}

/**
 * Export registrations to CSV format
 */
export function exportResponsesToCSV({
    registrations,
    questions,
    eventTitle,
}: ExportOptions): void {
    // Sort questions by order
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

    // Build headers
    const headers = [
        'Name',
        'Email',
        'Status',
        'Registered At',
        'University Email',
        'Student ID',
        'Registration Reason',
        ...sortedQuestions.map((q) => q.label),
    ];

    // Build rows
    const rows = registrations.map((registration) => {
        const baseData = [
            registration.userName,
            registration.userEmail,
            registration.status.replace('_', ' '),
            new Date(registration.registrationTime).toLocaleString(),
            registration.universityEmail || '',
            registration.studentId || '',
            registration.reason || '',
        ];

        // Add dynamic question responses
        sortedQuestions.forEach((question) => {
            const response = registration.responses?.find(
                (r) => r.questionId === question.id
            );

            if (response) {
                if (Array.isArray(response.value)) {
                    baseData.push(response.value.join('; '));
                } else {
                    baseData.push(response.value || '');
                }
            } else {
                baseData.push('');
            }
        });

        return baseData;
    });

    // Escape CSV values
    const escapeCSV = (value: string): string => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    };

    // Build CSV content
    const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    const filename = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_registrations_${date}.csv`;

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}
