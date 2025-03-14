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

/**
 * Visualizes a learner's time spent learning per day as a line chart.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {CourseData} props.courseData - Structured course data containing sections and activities
 * @param {LearnerProfile} props.learner - The learner profile data
 * 
 * @returns {React.ReactElement} A line chart displaying learning time per day
 */
const LearningTimeChart: React.FC<LearningTimeProps> = ({ statements, learner }) => {
    const theme = useTheme();

    /**
     * Processes xAPI statements to extract daily learning time data.
     * Filters for the current learner and "exited" verb statements with duration.
     * 
     * @returns {Array} Array of objects containing date and time spent data
     * @property {string} date - The date in YYYY-MM-DD format
     * @property {number} time - Total learning time in minutes for that day
     */
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

        return Object.entries(timeMap)
            .map(([date, time]) => ({ date, time }))
            .sort((a, b) => dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1); 
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