import { Registration, EventQuestion, TeamMemberResponse } from '@/types';
import * as XLSX from 'xlsx';

interface ExportOptions {
    registrations: Registration[];
    questions: EventQuestion[];
    memberQuestions?: EventQuestion[];
    eventTitle: string;
}

/**
 * Export registrations with their responses to an Excel file
 */
export function exportResponsesToExcel({
    registrations,
    questions,
    memberQuestions = [],
    eventTitle,
}: ExportOptions): void {
    // Sort questions by order
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
    const sortedMemberQuestions = [...memberQuestions].sort((a, b) => a.order - b.order);

    // Build the data rows
    const rows: Record<string, string>[] = [];

    registrations.forEach((registration) => {
        const isTeamRegistration = (registration.teamSize ?? 0) > 0;

        // Base registration data
        const baseData: Record<string, string> = {
            'Name': registration.userName,
            'Email': registration.userEmail,
            'Status': registration.status.replace('_', ' '),
            'Registered At': new Date(registration.registrationTime).toLocaleString(),
        };

        // Add team size for team registrations
        if (isTeamRegistration) {
            baseData['Team Size'] = registration.teamSize?.toString() || '';
        }

        // Add dynamic question responses - use teamResponses for team events, responses for individual
        const responsesSource = isTeamRegistration ? registration.teamResponses : registration.responses;
        sortedQuestions.forEach((question) => {
            const response = responsesSource?.find(
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

        // For team registrations, add member data as columns (Member 1 Name, Member 2 Name, etc.)
        if (isTeamRegistration && registration.memberResponses && registration.memberResponses.length > 0) {
            registration.memberResponses.forEach((member: TeamMemberResponse, index: number) => {
                const memberNum = index + 1;

                // Add member basic info columns
                baseData[`Member ${memberNum} Name`] = member.memberName;
                baseData[`Member ${memberNum} KFUPM Email`] = member.kfupmEmail || '';
                baseData[`Member ${memberNum} KFUPM ID`] = member.kfupmId || '';

                // Add member-specific question responses as columns
                sortedMemberQuestions.forEach((question) => {
                    const response = member.responses?.find(
                        (r) => r.questionId === question.id
                    );

                    if (response) {
                        if (Array.isArray(response.value)) {
                            baseData[`Member ${memberNum}: ${question.label}`] = response.value.join(', ');
                        } else {
                            baseData[`Member ${memberNum}: ${question.label}`] = response.value || '';
                        }
                    } else {
                        baseData[`Member ${memberNum}: ${question.label}`] = '';
                    }
                });
            });
        }

        // Add this single row to the export
        rows.push(baseData);
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    // Auto-size columns to fit content
    const maxWidth = 80; // Reasonable max to prevent excessively wide columns
    const minWidth = 12; // Minimum column width
    const colWidths: { wch: number }[] = [];

    if (rows.length > 0) {
        // Get ALL unique column names from ALL rows (not just first row)
        const allColumns = new Set<string>();
        rows.forEach(row => {
            Object.keys(row).forEach(key => allColumns.add(key));
        });

        // Convert to array and size each column
        Array.from(allColumns).forEach((key) => {
            // Find the maximum content width for this column across ALL rows
            const headerWidth = key.length;
            const maxContentWidth = Math.max(
                headerWidth,
                ...rows.map((row) => {
                    const cellValue = (row[key] || '').toString();
                    // Account for line breaks
                    return Math.max(...cellValue.split('\n').map(line => line.length));
                })
            );
            // Add padding and cap at reasonable max
            const width = Math.min(Math.max(maxContentWidth + 3, minWidth), maxWidth);
            colWidths.push({ wch: width });
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

interface MultiAreaExportOptions {
    areaData: {
        areaName: string;
        registrations: Registration[];
        questions: EventQuestion[];
        memberQuestions?: EventQuestion[];
    }[];
    baseEventName: string; // e.g., 'Hackathon' or 'Debate'
}

/**
 * Export registrations from multiple areas into one Excel file with separate tabs
 */
export function exportMultiAreaToExcel({
    areaData,
    baseEventName,
}: MultiAreaExportOptions): void {
    const workbook = XLSX.utils.book_new();

    areaData.forEach(({ areaName, registrations, questions, memberQuestions = [] }) => {
        if (registrations.length === 0) return;

        const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
        const sortedMemberQuestions = [...memberQuestions].sort((a, b) => a.order - b.order);
        const rows: Record<string, string>[] = [];

        registrations.forEach((registration) => {
            const isTeamRegistration = (registration.teamSize ?? 0) > 0;
            const rowData: Record<string, string> = {
                'Name': registration.userName,
                'Email': registration.userEmail,
                'Status': registration.status.replace('_', ' '),
                'Registered At': new Date(registration.registrationTime).toLocaleString(),
            };

            if (isTeamRegistration) {
                rowData['Team Size'] = registration.teamSize?.toString() || '';
            }

            const responsesSource = isTeamRegistration ? registration.teamResponses : registration.responses;
            sortedQuestions.forEach((question) => {
                const response = responsesSource?.find((r) => r.questionId === question.id);
                if (response) {
                    if (Array.isArray(response.value)) {
                        rowData[question.label] = response.value.join(', ');
                    } else {
                        rowData[question.label] = response.value || '';
                    }
                } else {
                    rowData[question.label] = '';
                }
            });

            if (isTeamRegistration && registration.memberResponses && registration.memberResponses.length > 0) {
                registration.memberResponses.forEach((member: TeamMemberResponse, index: number) => {
                    const memberNum = index + 1;
                    rowData[`Member ${memberNum} Name`] = member.memberName;
                    rowData[`Member ${memberNum} KFUPM Email`] = member.kfupmEmail || '';
                    rowData[`Member ${memberNum} KFUPM ID`] = member.kfupmId || '';

                    sortedMemberQuestions.forEach((question) => {
                        const response = member.responses?.find((r) => r.questionId === question.id);
                        if (response) {
                            if (Array.isArray(response.value)) {
                                rowData[`Member ${memberNum}: ${question.label}`] = response.value.join(', ');
                            } else {
                                rowData[`Member ${memberNum}: ${question.label}`] = response.value || '';
                            }
                        } else {
                            rowData[`Member ${memberNum}: ${question.label}`] = '';
                        }
                    });
                });
            }

            rows.push(rowData);
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const maxWidth = 80;
        const minWidth = 12;
        const colWidths: { wch: number }[] = [];

        if (rows.length > 0) {
            const allColumns = new Set<string>();
            rows.forEach(row => Object.keys(row).forEach(key => allColumns.add(key)));

            Array.from(allColumns).forEach((key) => {
                const headerWidth = key.length;
                const maxContentWidth = Math.max(
                    headerWidth,
                    ...rows.map((row) => {
                        const cellValue = (row[key] || '').toString();
                        return Math.max(...cellValue.split('\n').map(line => line.length));
                    })
                );
                const width = Math.min(Math.max(maxContentWidth + 3, minWidth), maxWidth);
                colWidths.push({ wch: width });
            });
        }
        worksheet['!cols'] = colWidths;

        const safeTitle = areaName.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, safeTitle || areaName);
    });

    const date = new Date().toISOString().split('T')[0];
    const filename = `${baseEventName.replace(/[^a-zA-Z0-9]/g, '_')}_All_Areas_${date}.xlsx`;
    XLSX.writeFile(workbook, filename);
}
