import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { XAPIStatement, CourseData } from '../types/types';

interface StudentGradeRecProps {
    statements: XAPIStatement[];
    courseData: CourseData;
}

const StudentGradeRec: React.FC<StudentGradeRecProps> = ({ statements }) => {
    const scoredStatements = statements.filter(
        (statement) => statement.verb.id === 'http://adlnet.gov/expapi/verbs/scored'
    );

    const studentGrades = useMemo(() => {
        const gradesMap: Record<string, { totalScore: number; count: number }> = {};

        scoredStatements.forEach((statement) => {
            const studentEmail = statement.actor.mbox;
            const username = studentEmail.split('@')[0];

            const score = statement.result?.score?.raw;

            if (username && score !== undefined) {
                if (!gradesMap[studentEmail]) {
                    gradesMap[username] = { totalScore: 0, count: 0 };
                }
                gradesMap[username].totalScore += score;
                gradesMap[username].count += 1;
            }
        });

        const studentAverages = Object.entries(gradesMap).map(([email, data]) => ({
            email,
            averageScore: data.totalScore / data.count,
        }));

        // Calculate overall average
        const overallAverage = studentAverages.reduce((sum, student) =>
            sum + student.averageScore, 0) / studentAverages.length;

        // Find students with grades significantly below average (>20% worse)
        return {
            students: studentAverages.filter(
                student => student.averageScore < overallAverage * 0.8
            ),
            overallAverage
        };
    }, [scoredStatements]);

    return (
        <Box sx={{
            height: 'calc(100% - 56px)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            gap: 1,
            paddingRight: 1,
            paddingLeft: 1,
            maxHeight: '100%',
            minHeight: 0,
            '& .MuiTableContainer-root': {
                mb: 2
            },
            '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
                background: '#FF9800',
                borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
                background: '#F57C00',
            },
        }}>
            {studentGrades.students.length > 0 ? (
                studentGrades.students.map((student, index) => (
                    <Box
                        key={index}
                        sx={{
                            p: 1,
                            bgcolor: '#FFF3E0',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: '#FFB74D',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                            display: 'flex',
                            flexDirection: 'column',
                            flex: '0 0 auto',
                            minHeight: '30px',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 2,
                                cursor: 'pointer',
                                bgcolor: '#FFE0B2',
                            },
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                        }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: '#E65100',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {student.email.replace('mailto:', '')}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    px: 1.5,
                                    py: 1.5,
                                    bgcolor: student.averageScore >= studentGrades.overallAverage * 0.9
                                        ? '#F57C00'
                                        : student.averageScore >= studentGrades.overallAverage * 0.85
                                            ? '#D32F2F'
                                            : '#9F2F2F',
                                    color: 'white',
                                    borderRadius: 1,
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    lineHeight: 1,
                                }}
                            >
                                Average Grade: {student.averageScore.toFixed(1)}
                            </Typography>
                        </Box>

                        <Typography
                            variant="body2"
                            sx={{
                                color: '#D32F2F',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                marginBottom: '8px',
                            }}
                        >
                            🚨 Student needs attention! Grade is significantly below class average of {studentGrades.overallAverage.toFixed(2)}.
                        </Typography>

                    </Box>
                ))
            ) : (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                    textAlign: 'center',
                    p: 2,
                }}>
                    <Typography>
                        🎉 Great! No students are significantly underperforming compared to the class average.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default StudentGradeRec;