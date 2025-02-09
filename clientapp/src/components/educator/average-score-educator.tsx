import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';

interface AverageScoreEducatorProps {
    statements: XAPIStatement[];
    learners: LearnerProfile[];
    courseData: CourseData;
}

const AverageScoreEducator: React.FC<AverageScoreEducatorProps> = ({ statements, learners, courseData }) => {
    const theme = useTheme();

    // Berechne den durchschnittlichen Score f�r alle Nutzer
    const averageScore = useMemo(() => {
        const scores: number[] = [];

        learners.forEach(learner => {
            const userScores = statements
                .filter(statement => statement.actor.mbox === learner.email && statement.verb.id === 'http://adlnet.gov/expapi/verbs/scored')
                .map(statement => statement.result!.score!.scaled! * 100); // Skaliert auf %

            if (userScores.length > 0) {
                const userAvgScore = userScores.reduce((sum, score) => sum + score, 0) / userScores.length;
                scores.push(userAvgScore);
            }
        });

        // Gesamt-Mittelwert f�r alle Nutzer berechnen
        return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    }, [statements, learners]);

    // Daten f�r das Kreisdiagramm
    const chartData = [
        { name: 'Average Score', value: averageScore },
        { name: 'Remaining', value: 100 - averageScore }
    ];

    const COLORS = ['#1565C0', '#90CAF9'];

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
                Average Score
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
                            {/* Absolute Zahl im Zentrum anzeigen */}
                            <Label value={`${averageScore.toFixed(1)}%`} position="center" fontSize={20} fontWeight="bold" fill="#1565C0" />
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => {
                                let numValue: number;

                                if (typeof value === 'number') {
                                    numValue = value;
                                } else if (typeof value === 'string') {
                                    numValue = parseFloat(value);
                                } else if (Array.isArray(value)) {
                                    numValue = parseFloat(value[0] as string); // Erstes Element konvertieren
                                } else {
                                    numValue = 0; // Fallback-Wert
                                }

                                return numValue.toFixed(1);
                            }}
                        />
                        <Legend verticalAlign="bottom" height={80} />
                    </PieChart>
                </ResponsiveContainer>
            </Box>

        </Box>
    );
};

export default AverageScoreEducator;