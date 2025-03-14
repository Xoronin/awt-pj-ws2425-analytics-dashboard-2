import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { XAPIStatement, CourseData } from '../types/types';

interface StudentGradeRecProps {
    statements: XAPIStatement[];
    courseData: CourseData;
}

/**
 * Identifies and displays students with below-average grades,
 * providing recommendations for educators to address underperforming students.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {CourseData} props.courseData - Structured course data containing sections and activities
 * 
 * @returns {React.ReactElement} A scrollable list of students with below-average grades
 */
const StudentGradeRec: React.FC<StudentGradeRecProps> = ({ statements }) => {
    const scoredStatements = statements.filter(
        (statement) => statement.verb.id === 'http://adlnet.gov/expapi/verbs/scored'
    );

    /**
     * Analyzes scored statements to calculate grade averages and identify 
     * students performing significantly below the class average.
     * 
     * @returns {Object} Object containing grade analysis
     * @property {Array} students - Underperforming students sorted by lowest score
     * @property {number} overallAverage - Average grade across all students
     */
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

        const overallAverage = studentAverages.reduce((sum, student) =>
            sum + student.averageScore, 0) / studentAverages.length;

        return {
            students: studentAverages
                .filter(student => student.averageScore < overallAverage * 0.6)
                .sort((a, b) => a.averageScore - b.averageScore), 
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
                                    bgcolor: student.averageScore <= studentGrades.overallAverage * 0.4
                                        ? '#6B1212'
                                        : '#D32F2F',
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
                            🚨 Student needs attention! Grade is significantly below class average.
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