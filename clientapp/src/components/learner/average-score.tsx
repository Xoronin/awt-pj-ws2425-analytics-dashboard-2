import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile } from '../../types/types';

interface AverageScoreProps {
    statements: XAPIStatement[];
    learner: LearnerProfile;
}

const AverageScoreChart: React.FC<AverageScoreProps> = ({ statements, learner }) => {
    const theme = useTheme();

    // Berechne den durchschnittlichen Score für den Nutzer
    const averageScore = useMemo(() => {
        const scores = statements
            .filter(statement => statement.actor.mbox === learner.email && statement.verb.id === 'http://adlnet.gov/expapi/verbs/scored')
            .map(statement => statement.result!.score!.scaled! * 100); // Skaliert auf %

        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        return scores.length > 0 ? Math.round(totalScore / scores.length) : 0;
    }, [statements, learner]);

    // Daten für das Kreisdiagramm
    const chartData = [
        { name: 'Achieved Score', value: averageScore },
        { name: 'Remaining', value: 100 - averageScore }
    ];
    const COLORS = ['#7B1FA2', '#BA68C8'];

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
                Your Average Score
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
                        {/* Absolute Zahl im Zentrum anzeigen */}
                        <Label value={`${averageScore.toFixed(1)}%`} position="center" fontSize={20} fontWeight="bold" fill="#7B1FA2" />
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
    );
};

export default AverageScoreChart;