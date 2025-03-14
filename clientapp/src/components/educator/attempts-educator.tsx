import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';

interface AttemptsEducatorProps {
    statements: XAPIStatement[];
    learners: LearnerProfile[]; // Alle Lernenden
    courseData: CourseData;
}

const AttemptsEducator: React.FC<AttemptsEducatorProps> = ({ statements, learners, courseData }) => {
    const theme = useTheme();

    const COLORS = ['#1565C0', '#90CAF9'];

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
                Passed Attempts
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