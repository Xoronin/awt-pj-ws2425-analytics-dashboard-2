import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';

interface LearningAttempts {
    statements: XAPIStatement[];
    learner: LearnerProfile;
    courseData: CourseData;
}

/**
 * Visualizes a learner's pass/fail attempts as a donut chart.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {LearnerProfile} props.learner - The learner profile data
 * @param {CourseData} props.courseData - Structured course data containing sections and activities
 * 
 * @returns {React.ReactElement} A donut chart displaying pass/fail attempts with percentage
 */
const LearningAttempts: React.FC<LearningAttempts> = ({ statements, learner }) => {
    const theme = useTheme();

    const COLORS = ['#7B1FA2', '#BA68C8'];

    /**
     * Calculates and organizes learning attempt statistics from xAPI statements.
     * 
     * @returns {Object} Statistics about learning attempts
     * @property {number} failed - Total number of failed attempts
     * @property {number} passed - Total number of passed attempts
     * @property {number} totalActivities - Number of distinct activities attempted
     * @property {number} averageAttempts - Average number of attempts per activity
     */
    const attemptsData = useMemo(() => {
        const attemptsMap: Record<string, { failed: number; passed: number }> = {};

        statements
            .filter(statement => statement.actor.mbox === learner.email)
            .forEach(statement => {
                const activityId = statement.object.id;
                if (!attemptsMap[activityId]) {
                    attemptsMap[activityId] = { failed: 0, passed: 0 };
                }

                if (statement.verb.id === "http://adlnet.gov/expapi/verbs/passed") {
                    attemptsMap[activityId].passed += 1;
                } else if (statement.verb.id === "http://adlnet.gov/expapi/verbs/failed") {
                    attemptsMap[activityId].failed += 1;
                }
            });

        const totalAttempts = Object.values(attemptsMap).reduce(
            (acc, { failed, passed }) => {
                acc.failed += failed;
                acc.passed += passed;
                return acc;
            },
            { failed: 0, passed: 0 }
        );

        const totalActivities = Object.keys(attemptsMap).length || 1;

        return {
            failed: totalAttempts.failed,
            passed: totalAttempts.passed,
            totalActivities,
            averageAttempts: (totalAttempts.failed + totalAttempts.passed) / totalActivities
        };
    }, [statements, learner]);

    const chartData = [
        { name: 'Passed Attempts', value: attemptsData.passed },
        { name: 'Failed Attempts', value: attemptsData.failed }
    ];

    const passedPercentage = ((attemptsData.passed / (attemptsData.passed + attemptsData.failed)) * 100).toFixed(1);

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            <Typography
                sx={{
                    fontSize: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#7B1FA2',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}
            >
                Your Passed Attempts
            </Typography>

            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius="60%"
                        outerRadius="80%"
                        fill={theme.palette.primary.main}
                        labelLine={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                        <Label value={`${passedPercentage}%`} fontSize={20} fontWeight="bold" position="center" fill="#7B1FA2" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={80} />
                </PieChart>
            </ResponsiveContainer>

        </Box>
    );
};

export default LearningAttempts;