import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel } from '@mui/material';
import { XAPIStatement } from '../../types/types';

/**
 * Props interface for the StudentPerformanceTable component
 * @interface StudentPerformanceProps
 * @property {XAPIStatement[]} statements - Array of xAPI statements containing student performance data
*/
interface StudentPerformanceProps {
    statements: XAPIStatement[];
}

/**
 * Component that displays student performance data in a sortable table with mini charts
 * 
 * This component analyzes xAPI statements to extract student performance metrics including:
 * - Average grades
 * - Grade progression over time (displayed as mini line charts)
 * - Average number of attempts per successful completion
 * 
 * @component
 * @param {StudentPerformanceProps} props - Component props
 * @returns {React.ReactElement} The rendered component
*/
const StudentPerformanceTable: React.FC<StudentPerformanceProps> = ({ statements }) => {
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
    const [sortBy, setSortBy] = useState<'id' | 'average' | 'attempts'>('id');

    /**
     * Extracts a numeric identifier from an email/mbox string
     * Used for sorting students by their ID
     * 
     * @param {string} mbox - The mbox identifier string (typically an email)
     * @returns {number} The extracted numeric ID or 0 if not found
    */
    const extractNumberFromMbox = (mbox: string) => {
        const match = mbox.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    };

    /**
     * Processes xAPI statements to extract student performance data
     * 
     * Aggregates data for each student including:
     * - All grade values
     * - Total attempts at activities
     * - Number of successful completions
     * 
     * @returns {Array<{id: string, mbox: string, grades: number[], average: string, attempts: string}>} 
     *          Processed student performance data with calculated metrics
    */
    const studentData = useMemo(() => {
        const studentMap = new Map<string, { id: string; mbox: string; grades: number[]; totalAttempts: number; passedCount: number }>();

        statements.forEach(statement => {
            if (!statement.actor.mbox) return;
            const mbox = statement.actor.mbox;
            const verbId = statement.verb.id;
            const activityId = statement.object.definition.extensions?.['https://w3id.org/learning-analytics/learning-management-system/external-id'];
            const grade = statement.result?.score?.raw;

            if (!studentMap.has(mbox)) {
                studentMap.set(mbox, {
                    id: mbox,
                    mbox: mbox,
                    grades: [],
                    totalAttempts: 0,
                    passedCount: 0
                });
            }
            const student = studentMap.get(mbox)!;

            if (verbId === 'http://adlnet.gov/expapi/verbs/scored' && grade !== undefined) {
                student.grades.push(grade);
            }

            if (verbId === 'http://adlnet.gov/expapi/verbs/passed') {
                student.passedCount += 1;
            }

            if (verbId === 'http://adlnet.gov/expapi/verbs/failed' || verbId === 'http://adlnet.gov/expapi/verbs/passed') {
                student.totalAttempts += 1;
            }
        });

        return Array.from(studentMap.values()).map(student => {
            const averageGrade = student.grades.length > 0
                ? (student.grades.reduce((sum, grade) => sum + grade, 0) / student.grades.length).toFixed(1)
                : 'N/A';

            const averageAttempts = student.passedCount > 0
                ? (student.totalAttempts / student.passedCount).toFixed(1)
                : 'N/A';

            return {
                id: student.id,
                mbox: student.mbox,
                grades: student.grades,
                average: averageGrade,
                attempts: averageAttempts
            };
        });
    }, [statements]);

    /**
     * Sorts the student data based on the current sort column and direction
     * 
     * @returns {Array<{id: string, mbox: string, grades: number[], average: string, attempts: string}>}
     *          Sorted array of student data
    */
    const sortedData = useMemo(() => {
        const sorted = [...studentData];
        if (sortBy === 'id') {
            sorted.sort((a, b) => {
                const numA = extractNumberFromMbox(a.mbox);
                const numB = extractNumberFromMbox(b.mbox);
                return sortDirection === 'asc'
                    ? numA - numB
                    : numB - numA;
            });
        } else if (sortBy === 'average') {
            sorted.sort((a, b) => {
                if (a.average === 'N/A' || b.average === 'N/A') return 0;
                return sortDirection === 'asc'
                    ? parseFloat(a.average) - parseFloat(b.average)
                    : parseFloat(b.average) - parseFloat(a.average);
            });
        } else if (sortBy === 'attempts') {
            sorted.sort((a, b) => {
                if (a.attempts === 'N/A' || b.attempts === 'N/A') return 0;
                return sortDirection === 'asc'
                    ? parseFloat(a.attempts) - parseFloat(b.attempts)
                    : parseFloat(b.attempts) - parseFloat(a.attempts);
            });
        }
        return sorted;
    }, [studentData, sortBy, sortDirection]);

    /**
     * Handles sorting when a column header is clicked
     * Toggles sort direction if the same column is clicked again
     * 
     * @param {('id' | 'average' | 'attempts')} column - The column identifier to sort by
    */
    const handleSort = (column: 'id' | 'average' | 'attempts') => {
        const isAsc = sortBy === column && sortDirection === 'asc';
        setSortDirection(isAsc ? 'desc' : 'asc');
        setSortBy(column);
    };

    return (
        <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Typography
                sx={{
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#2E7D32',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    mb: 1
                }}
            >
                Student Performance Overview
            </Typography>
            <TableContainer
                component={Paper}
                sx={{
                    height: '100%',
                    overflowX: 'auto',
                    minHeight: 0,
                    marginBottom: 3,
                    paddingRight: 1,
                    backgroundColor: 'transparent',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px'
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#E8F5E9'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#2E7D32',
                        borderRadius: '4px'
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: '#1B5E20'
                    }
                }}
            >
                <Table stickyHeader size="small" sx={{
                    '& .MuiTableCell-root': {
                        padding: '5px',
                        fontSize: '0.875rem'
                    },
                    '& .MuiTableCell-body': {
                        '&:nth-of-type(3), &:nth-of-type(4)': {
                            textAlign: 'center'
                        }
                    },
                    width: '100%',
                    tableLayout: 'fixed'
                }}>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    width: '40%',
                                    backgroundColor: '#2E7D32',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            >
                                <TableSortLabel
                                    active={sortBy === 'id'}
                                    direction={sortDirection || 'asc'}
                                    onClick={() => handleSort('id')}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: 'white !important',
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important'
                                        }
                                    }}
                                >
                                    Student ID
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                sx={{
                                    width: '20%',
                                    backgroundColor: '#2E7D32',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            >
                                Grade Over Time
                            </TableCell>
                            <TableCell
                                sx={{
                                    width: '20%',
                                    backgroundColor: '#2E7D32',
                                    color: 'white'
                                }}
                            >
                                <TableSortLabel
                                    active={sortBy === 'average'}
                                    direction={sortDirection || 'asc'}
                                    onClick={() => handleSort('average')}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: 'white !important',
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important'
                                        }
                                    }}
                                >
                                    Average Grade
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                sx={{
                                    width: '20%',
                                    backgroundColor: '#2E7D32',
                                    color: 'white'
                                }}
                            >
                                <TableSortLabel
                                    active={sortBy === 'attempts'}
                                    direction={sortDirection || 'asc'}
                                    onClick={() => handleSort('attempts')}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: 'white !important',
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important'
                                        }
                                    }}
                                >
                                    Average Attempts
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((student) => (
                            <TableRow
                                key={student.id}
                                sx={{
                                    '&:nth-of-type(odd)': {
                                        backgroundColor: 'rgba(46, 125, 50, 0.04)',
                                    }
                                }}
                            >
                                <TableCell sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {student.mbox}
                                </TableCell>
                                <TableCell>
                                    <ResponsiveContainer width={100} height={50}>
                                        <LineChart data={student.grades.map((grade, index) => ({ index, grade }))}>
                                            <XAxis dataKey="index" hide />
                                            <YAxis domain={['auto', 'auto']} hide />
                                            <Tooltip formatter={(value) => [`${value} Grade`, '']} />
                                            <Line
                                                type="monotone"
                                                dataKey="grade"
                                                stroke="#2E7D32"
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </TableCell>
                                <TableCell>{student.average}</TableCell>
                                <TableCell>{student.attempts}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default StudentPerformanceTable;