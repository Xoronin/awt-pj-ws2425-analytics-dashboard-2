import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

interface LearningTimeProps {
    statements: XAPIStatement[];
    courseData: CourseData;
    learner: LearnerProfile;
}

const LearningTimeChart: React.FC<LearningTimeProps> = ({ statements, learner }) => {
    const theme = useTheme();

    const learningData = useMemo(() => {
        const timeMap: Record<string, number> = {};

        statements
            .filter(statement => statement.actor.mbox === learner.email)
            .forEach(statement => {
                const date = dayjs(statement.timestamp).format('YYYY-MM-DD');
                const duration = statement.result?.duration
                    ? dayjs.duration(statement.result.duration).asMinutes()
                    : 0;
                if (duration > 0) {
                    timeMap[date] = (timeMap[date] || 0) + duration;
                }
            });

        // Um das Datum chronologisch zu sortieren, wird die data nach dem Datum sortiert
        return Object.entries(timeMap)
            .map(([date, time]) => ({ date, time }))
            .sort((a, b) => dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1);  // Sortierung nach Datum
    }, [statements, learner]);

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <Typography variant="body1" gutterBottom>
                Learning Time per Day
            </Typography>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={learningData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(tick) => dayjs(tick).format('DD.MM')} />
                    <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value} min`, "Time Spent"]} />
                    <Line type="monotone" dataKey="time" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default LearningTimeChart;