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
            .filter(statement => statement.actor.mbox === learner.email && statement.verb.id === "http://adlnet.gov/expapi/verbs/exited")
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
        <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Typography
                sx={{
                    fontSize: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#1565C0',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    mb: 1
                }}
            >
                Learning Time per Day
            </Typography>

            <Box sx={{
                flex: 1,
                minHeight: 0,
                width: '100%',
                pb: 2
            }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={learningData}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 30
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            label={{
                                value: 'Dates',
                                position: 'insideBottom',
                                style: { fontSize: '0.8em' },
                                offset: -15
                            }}
                            tickFormatter={(tick) => dayjs(tick).format('DD.MM')}
                            interval="preserveStartEnd"
                            tick={{ fontSize: '0.75em' }}
                        />
                        <YAxis
                            label={{
                                value: 'Minutes',
                                angle: -90,
                                position: 'insideLeft',
                                style: { fontSize: '0.8em' },
                                offset: 15,
                                dy: 20,
                            }}
                            tick={{ fontSize: '0.75em' }}
                        />
                        <Tooltip
                            formatter={(value) => [`${value} min`, "Time Spent"]}
                            contentStyle={{
                                fontSize: '0.8em'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="time"
                            stroke={theme.palette.primary.main}
                            strokeWidth={1.5}
                            dot={{ r: 3 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default LearningTimeChart;