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
        const ratingsCount = Array(10).fill(0); 

        statements
            .filter(statement => statement.verb.id === 'http://id.tincanapi.com/verb/rated') 
            .forEach(statement => {
                const rawScore = statement.result?.score?.raw;
                if (rawScore !== undefined && rawScore >= 1 && rawScore <= 10) {
                    ratingsCount[rawScore - 1] += 1; 
                }
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
