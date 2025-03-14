import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement } from '../../types/types';

/**
 * Props interface for the ActivityRatings component
 * @interface ActivityRatingsProps
 * @property {XAPIStatement[]} statements - Array of xAPI statements containing rating data
 */
interface ActivityRatingsProps {
    statements: XAPIStatement[];
}

/**
 * Component that displays a bar chart visualization of activity ratings
 * 
 * This component analyzes xAPI statements with "rated" verbs to create a
 * distribution chart showing how many ratings were given for each score (1-10).
 * 
 * @component
 * @param {ActivityRatingsProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const ActivityRatings: React.FC<ActivityRatingsProps> = ({ statements }) => {
    const theme = useTheme();

    /**
     * Processes xAPI statements to extract rating data
     * 
     * This function:
     * 1. Filters statements for those with the "rated" verb
     * 2. Counts occurrences of each rating score (1-10)
     * 3. Transforms the data into the format required by the chart
     * 
     * @returns {Array<{rating: number, count: number}>} Array of rating counts for visualization
     */
    const ratingsData = useMemo(() => {
        const ratingsCount = Array(10).fill(0);
        const studentLatestRating = new Map();

        statements
            .filter(statement =>
                statement.verb.id === 'http://id.tincanapi.com/verb/rated' &&
                statement.actor?.mbox)
            .forEach(statement => {
                const studentEmail = statement.actor.mbox;
                const rawScore = statement.result?.score?.raw;
                const timestamp = new Date(statement.timestamp).getTime();

                if (rawScore !== undefined && rawScore >= 1 && rawScore <= 10) {
                    if (!studentLatestRating.has(studentEmail) ||
                        timestamp > studentLatestRating.get(studentEmail).timestamp) {
                        studentLatestRating.set(studentEmail, {
                            rating: rawScore,
                            timestamp: timestamp
                        });
                    }
                }
            });

        studentLatestRating.forEach(data => {
            ratingsCount[data.rating - 1] += 1;
        });

        return ratingsCount.map((count, index) => ({
            rating: index + 1,
            count,
        }));
    }, [statements]);

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
                    color: theme.palette.primary.main,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    mb: 1
                }}
            >
                Activity Ratings Distribution
            </Typography>


            <Box sx={{
                flex: 1,
                minHeight: 0,
                width: '100%',
                pb: 2
            }}>

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={ratingsData}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 30
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="rating"
                            label={{
                                value: 'Rating (1-10)',
                                position: 'insideBottom',
                                offset: -15,
                                style: { fontSize: '0.8em' }
                            }}
                            tick={{ fontSize: '0.75em' }}
                        />
                        <YAxis
                            allowDecimals={false}
                            label={{
                                value: 'Count',
                                angle: -90,
                                position: 'insideLeft',
                                style: { fontSize: '0.8em' },
                                offset: 15,
                                dy: 20,
                            }}
                            tick={{ fontSize: '0.75em' }}
                        />
                        <Tooltip
                            contentStyle={{
                            fontSize: '0.8em'
                            }} 
                            formatter={(value: number) => [`${value} Ratings`, 'Count']}
                        />
                        <Bar dataKey="count" fill={theme.palette.primary.main} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default ActivityRatings;
