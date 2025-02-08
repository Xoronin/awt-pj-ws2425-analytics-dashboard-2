import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, TableSortLabel } from '@mui/material';
import { XAPIStatement } from '../../types/types';

interface StudentPerformanceProps {
    statements: XAPIStatement[];
}

const StudentPerformanceTable: React.FC<StudentPerformanceProps> = ({ statements }) => {
    const theme = useTheme();

    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
    const [sortBy, setSortBy] = useState<'average' | 'attempts'>('average');

    const studentData = useMemo(() => {
        const studentMap = new Map<string, { id: string; grades: number[]; totalAttempts: number; passedCount: number }>();

        statements.forEach(statement => {
            if (!statement.actor.mbox) return;
            const studentId = statement.actor.mbox;
            const verbId = statement.verb.id;
            const activityId = statement.object.definition.extensions?.['https://w3id.org/learning-analytics/learning-management-system/external-id'];
            const grade = statement.result?.score?.raw;

            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, { id: studentId, grades: [], totalAttempts: 0, passedCount: 0 });
            }
            const student = studentMap.get(studentId)!;

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
                ? (student.grades.reduce((sum, grade) => sum + grade, 0) / student.grades.length).toFixed(2) 
                : 'N/A';
            
            const averageAttempts = student.passedCount > 0 
                ? (student.totalAttempts / student.passedCount).toFixed(2) 
                : 'N/A';

            return {
                id: student.id,
                grades: student.grades,
                average: averageGrade,
                attempts: averageAttempts
            };
        });
    }, [statements]);

    // Sort function
    const sortedData = useMemo(() => {
        const sorted = [...studentData];
        if (sortBy === 'average') {
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

    // Handle sorting change
    const handleSort = (column: 'average' | 'attempts') => {
        const isAsc = sortBy === column && sortDirection === 'asc';
        setSortDirection(isAsc ? 'desc' : 'asc');
        setSortBy(column);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Student Performance Overview
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Student ID</TableCell>
                            <TableCell>Grade Over Time</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortBy === 'average'}
                                    direction={sortDirection || 'asc'}
                                    onClick={() => handleSort('average')}
                                >
                                    Average Grade
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortBy === 'attempts'}
                                    direction={sortDirection || 'asc'}
                                    onClick={() => handleSort('attempts')}
                                >
                                    Average Attempts To Pass
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell>{student.id}</TableCell>
                                <TableCell>
                                    <ResponsiveContainer width={100} height={50}>
                                        <LineChart data={student.grades.map((grade, index) => ({ index, grade }))}>
                                            <XAxis dataKey="index" hide />
                                            <YAxis domain={['auto', 'auto']} hide />
                                            <Tooltip formatter={(value) => [`${value} Grade`, '']} />
                                            <Line type="monotone" dataKey="grade" stroke={theme.palette.primary.main} dot={false} />
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
