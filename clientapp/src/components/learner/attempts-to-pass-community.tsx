import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';

interface LearningAttemptsCommunity {
    statements: XAPIStatement[];
    learners: LearnerProfile[]; // Alle Lernenden
    courseData: CourseData;
}

const LearningAttemptsCommunity: React.FC<LearningAttemptsCommunity> = ({ statements, learners, courseData }) => {
    const theme = useTheme();

    const COLORS = ['#5E35B1', '#D1C4E9'];

    const attemptsData = useMemo(() => {
        const attemptsMap: Record<string, { failed: number; passed: number }> = {};

        // Sammeln der Versuche f�r alle Lernenden
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

        // Berechne die mittlere Anzahl der Versuche f�r alle Lernenden
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

    // Berechne den Anteil der bestandenen Versuche
    const passPercentage = (attemptsData.passed / attemptsData.totalAttempts) * 100;

    const chartData = [
        { name: 'Passed Attempts', value: attemptsData.passed },
        { name: 'Failed Attempts', value: attemptsData.failed }
    ];

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            <Typography
                sx={{
                    fontSize: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#5E35B1',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}
            >
                Community's Attempts to Pass
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
                        <Label value={`${passPercentage.toFixed(1)}%`} position="center" fontSize={20} fontWeight="bold" fill="#5E35B1" />
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={80} />
                </PieChart>
            </ResponsiveContainer>

        </Box>
    );
};


export default LearningAttemptsCommunity;