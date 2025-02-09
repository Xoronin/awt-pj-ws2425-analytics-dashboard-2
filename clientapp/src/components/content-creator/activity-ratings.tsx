import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement } from '../../types/types';

interface ActivityRatingsProps {
    statements: XAPIStatement[];
}

const ActivityRatings: React.FC<ActivityRatingsProps> = ({ statements }) => {
    const theme = useTheme();

    const ratingsData = useMemo(() => {
        const ratingsCount = Array(10).fill(0); // Array for counting ratings from 1 to 10

        statements
            .filter(statement => statement.verb.id === 'http://id.tincanapi.com/verb/rated') // Filter for "rated" statements
            .forEach(statement => {
                const rawScore = statement.result?.score?.raw;
                if (rawScore !== undefined && rawScore >= 1 && rawScore <= 10) {
                    ratingsCount[rawScore - 1] += 1; // Subtract 1 to match array index (rating 1 -> index 0)
                }
            });

        return ratingsCount.map((count, index) => ({
            rating: index + 1,  // x-axis: rating from 1 to 10
            count,              // y-axis: number of occurrences
        }));
    }, [statements]);

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <Typography
                sx={{
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#1565C0',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}
            >
                Activity Ratings Distribution
            </Typography>


            <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={ratingsData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="rating"
                        label={{
                            value: 'Rating (1-10)',
                            position: 'insideBottom',
                            offset: -10,
                            fontSize: 18
                        }}
                    />
                    <YAxis
                        allowDecimals={false}
                        label={{
                            value: 'Count',
                            angle: -90,
                            position: 'insideLeft',
                            fontSize: 18
                        }}
                    />
                    <Tooltip formatter={(value: number) => [`${value} Ratings`, 'Count']} />
                    <Bar dataKey="count" fill={theme.palette.primary.main} />
                </BarChart>
            </ResponsiveContainer>

        </Box>
    );
};

export default ActivityRatings;
