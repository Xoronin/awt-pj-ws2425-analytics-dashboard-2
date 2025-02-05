import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';

interface LearningAttempts {
    statements: XAPIStatement[];
    learner: LearnerProfile;
    courseData: CourseData;
}

const LearningAttempts: React.FC<LearningAttempts> = ({ statements, learner }) => {
    const theme = useTheme();

    const COLORS = [theme.palette.success.main, theme.palette.grey[500]];

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

    // Berechne den Anteil der Passed Attempts als Prozentsatz mit 2 Nachkommastellen
    const passedPercentage = ((attemptsData.passed / (attemptsData.passed + attemptsData.failed)) * 100).toFixed(1);

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            <Typography variant="body1" sx={{ textAlign: 'center' }}>
                Your Attempts to Pass
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
                        innerRadius={80}
                        outerRadius={100}
                        fill={theme.palette.primary.main}
                        labelLine={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                        <Label value={`${passedPercentage}%`} fontSize={20} fontWeight="bold" position="center" fill="000000" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={56} />
                </PieChart>
            </ResponsiveContainer>

        </Box>
    );
};

export default LearningAttempts;