import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';

interface AverageScoreCommunity {
    statements: XAPIStatement[];
    learners: LearnerProfile[];
    courseData: CourseData; 
}

const AverageScoreChartCommunity: React.FC<AverageScoreCommunity> = ({ statements, learners, courseData }) => {
    const theme = useTheme();

    // Berechne den durchschnittlichen Score für alle Nutzer
    const averageScore = useMemo(() => {
        const scores: number[] = [];

        learners.forEach(learner => {
            const userScores = statements
                .filter(statement => statement.actor.mbox === learner.email && statement.result?.score?.scaled !== undefined)
                .map(statement => statement.result!.score!.scaled! * 100); // Skaliert auf %

            if (userScores.length > 0) {
                const userAvgScore = userScores.reduce((sum, score) => sum + score, 0) / userScores.length;
                scores.push(userAvgScore);
            }
        });

        // Gesamt-Mittelwert für alle Nutzer berechnen
        return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    }, [statements, learners]);

    // Daten für das Kreisdiagramm
    const chartData = [
        { name: 'Average Score', value: averageScore },
        { name: 'Remaining', value: 100 - averageScore }
    ];

    const COLORS = [theme.palette.success.main, theme.palette.grey[500]];

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            <Typography variant="body1" sx={{ textAlign: 'center' }}>
                Community's Average Score
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
                        {/* Absolute Zahl im Zentrum anzeigen */}
                        <Label value={`${averageScore.toFixed(1)}%`} position="center" fontSize={20} fontWeight="bold" fill="000000" />
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
                    <Legend verticalAlign="bottom" height={56} />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default AverageScoreChartCommunity;