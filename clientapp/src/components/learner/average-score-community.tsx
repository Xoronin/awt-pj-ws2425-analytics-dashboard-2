import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';

interface AverageScoreCommunity {
    statements: XAPIStatement[];
    learners: LearnerProfile[];
    courseData: CourseData; 
}

/**
 * Visualizes the community's average score as a donut chart.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {LearnerProfile[]} props.learners - Array of learner profiles
 * @param {CourseData} props.courseData - Structured course data
 * 
 * @returns {React.ReactElement} A donut chart displaying the community's average score as a percentage
 */
const AverageScoreChartCommunity: React.FC<AverageScoreCommunity> = ({ statements, learners, courseData }) => {
    const theme = useTheme();

    /**
     * Calculates the community's average score from scored xAPI statements.
     * First calculates each learner's average, then averages those scores.
     * 
     * @returns {number} Community average score as a percentage (0-100)
     */
    const averageScore = useMemo(() => {
        const scores: number[] = [];

        learners.forEach(learner => {
            const userScores = statements
                .filter(statement => statement.actor.mbox === learner.email && statement.verb.id === 'http://adlnet.gov/expapi/verbs/scored')
                .map(statement => statement.result!.score!.scaled! * 100);

            if (userScores.length > 0) {
                const userAvgScore = userScores.reduce((sum, score) => sum + score, 0) / userScores.length;
                scores.push(userAvgScore);
            }
        });

        return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    }, [statements, learners]);

    const chartData = [
        { name: 'Average Score', value: averageScore },
        { name: 'Remaining', value: 100 - averageScore }
    ];

    const COLORS = ['#5E35B1', '#D1C4E9'];

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
                        innerRadius="60%"
                        outerRadius="80%"
                        fill={theme.palette.primary.main}
                        labelLine={false}
                    >
                        <Label value={`${averageScore.toFixed(1)}%`} position="center" fontSize={20} fontWeight="bold" fill="#5E35B1" />
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
                                numValue = parseFloat(value[0] as string);
                            } else {
                                numValue = 0; 
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

export default AverageScoreChartCommunity;