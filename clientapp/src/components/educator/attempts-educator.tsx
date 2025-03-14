import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';

/**
 * Props interface for the AttemptsEducator component
 * @interface AttemptsEducatorProps
 * @property {XAPIStatement[]} statements - Array of xAPI statements containing attempt data
 * @property {LearnerProfile[]} learners - Array of learner profiles
 * @property {CourseData} courseData - Data about the course
*/
interface AttemptsEducatorProps {
    statements: XAPIStatement[];
    learners: LearnerProfile[]; 
    courseData: CourseData;
}

/**
 * Component that displays pass/fail attempt statistics as a donut chart
 * 
 * This component analyzes xAPI statements to calculate the ratio of passed
 * to failed attempts across all activities and learners.
 * 
 * @component
 * @param {AttemptsEducatorProps} props - Component props
 * @returns {React.ReactElement} The rendered component
*/
const AttemptsEducator: React.FC<AttemptsEducatorProps> = ({ statements, learners, courseData }) => {
    const theme = useTheme();

    const COLORS = ['#1565C0', '#90CAF9'];

    /**
     * Calculates attempt statistics from xAPI statements
     * 
     * Processes all statements to:
     * 1. Count passed and failed attempts for each activity
     * 2. Calculate total passed and failed attempts across all activities
     * 3. Determine the average number of attempts per activity
     * 
     * @returns {Object} Statistics about attempts including passed, failed, total, and average counts
    */
    const attemptsData = useMemo(() => {
        const attemptsMap: Record<string, { failed: number; passed: number }> = {};

        learners.forEach(learner => {
            statements.forEach(statement => {
                if (statement.actor.mbox === learner.email) {
                    if (statement.verb.id === "http://adlnet.gov/expapi/verbs/passed") {
                        const activityId = statement.object.id;
                        if (!attemptsMap[activityId]) {
                            attemptsMap[activityId] = { failed: 0, passed: 0 };
                        }
                        attemptsMap[activityId].passed += 1;
                    } else if (statement.verb.id === "http://adlnet.gov/expapi/verbs/failed") {
                        const activityId = statement.object.id;
                        if (!attemptsMap[activityId]) {
                            attemptsMap[activityId] = { failed: 0, passed: 0 };
                        }
                        attemptsMap[activityId].failed += 1;
                    }
                }
            });
        });

        const totalAttempts = Object.values(attemptsMap).reduce(
            (acc, { failed, passed }) => {
                acc.failed += failed;
                acc.passed += passed;
                return acc;
            },
            { failed: 0, passed: 0 }
        );

        const totalActivities = Object.keys(attemptsMap).length;
        const averageAttempts = (totalAttempts.failed + totalAttempts.passed) / totalActivities;

        return {
            failed: totalAttempts.failed,
            passed: totalAttempts.passed,
            totalAttempts: totalAttempts.failed + totalAttempts.passed, // Gesamtzahl der Versuche
            averageAttempts
        };
    }, [statements, learners]);

    /**
     * Calculates the percentage of successful attempts
     * This value is displayed in the center of the donut chart
    */
    const passPercentage = (attemptsData.passed / attemptsData.totalAttempts) * 100;

    const chartData = [
        { name: 'Passed Attempts', value: attemptsData.passed },
        { name: 'Failed Attempts', value: attemptsData.failed }
    ];

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
                    color: '#1565C0',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    mb: 1
                }}
            >
                Attempts to Pass
            </Typography>

            <Box sx={{
                flex: 1,
                width: '100%',
                position: 'relative',
                minHeight: 0
            }}>

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
                        <Label value={`${passPercentage.toFixed(1)}%`} position="center" fontSize={20} fontWeight="bold" fill="#1565C0" />
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={80} />
                </PieChart>
            </ResponsiveContainer>

            </Box>
        </Box>
    );
};


export default AttemptsEducator;