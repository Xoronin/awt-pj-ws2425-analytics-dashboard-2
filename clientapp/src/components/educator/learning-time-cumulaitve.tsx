import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { XAPIStatement, LearnerProfile } from '../../types/types';
import { Box, Typography } from '@mui/material';

interface LineTimeChartCumulativeProps {
    statements: XAPIStatement[];
    learnerProfiles: LearnerProfile[];
}

const LineTimeChartCumulative = ({ statements, learnerProfiles }: LineTimeChartCumulativeProps) => {
    // Helper function to parse ISO 8601 duration
    const parseDuration = (duration: string): number => {
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 0;
        const [, hours, minutes, seconds] = matches;
        return (
            (parseInt(hours || "0") * 60) +
            parseInt(minutes || "0") +
            Math.ceil(parseInt(seconds || "0") / 60)
        );
    };

    // Fixed set of colors for consistency
    const colors = [
        '#1565C0', // Primary blue
        '#42A5F5', // Light blue
        '#1976D2', // Secondary blue
        '#2196F3', // Another blue
        '#0D47A1', // Dark blue
    ];

    // Process statements to accumulate time per learner over time
    const data = useMemo(() => {
        const learnerData: Record<string, { date: string; time: number }[]> = {};
        learnerProfiles.forEach((learner) => {
            learnerData[learner.email] = [];
        });

        const sortedStatements = [...statements].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const cumulativeTime: Record<string, number> = {};

        sortedStatements.forEach((statement) => {
            const learnerEmail = statement.actor.mbox;
            if (!learnerData[learnerEmail]) return;

            const duration = statement.result?.duration ? parseDuration(statement.result.duration) : 0;
            cumulativeTime[learnerEmail] = (cumulativeTime[learnerEmail] || 0) + duration;

            learnerData[learnerEmail].push({
                date: new Date(statement.timestamp).toISOString().split("T")[0],
                time: cumulativeTime[learnerEmail],
            });
        });

        const mergedData: Record<string, any>[] = [];
        const allDates = Array.from(new Set(sortedStatements.map(s =>
            new Date(s.timestamp).toISOString().split("T")[0]
        )));

        allDates.forEach(date => {
            const entry: Record<string, any> = { name: date };
            learnerProfiles.forEach(learner => {
                const lastEntry = learnerData[learner.email].filter(e => e.date <= date).pop();
                entry[learner.email] = lastEntry ? lastEntry.time : 0;
            });
            mergedData.push(entry);
        });

        return mergedData;
    }, [statements, learnerProfiles]);

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
                Cumulative Learning Time
            </Typography>

            <Box sx={{
                flex: 1,
                minHeight: 0,
                width: '100%',
                pb:1
            }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 30
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#90CAF9" />
                        <XAxis
                            dataKey="name"
                            label={{
                                value: 'Dates',
                                position: 'insideBottom',
                                style: { fontSize: '0.8em' },
                                offset: -15
                            }}
                            tick={{ fontSize: '0.75em' }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        />
                        <YAxis
                            label={{
                                value: "Minutes",
                                angle: -90,
                                position: 'insideLeft',
                                style: { fontSize: '0.8em' },
                                offset: 10,
                                dy: 20,
                            }}
                            tick={{ fontSize: '0.75em' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#E3F2FD',
                                border: '1px solid #1565C0',
                                borderRadius: '4px'
                            }}
                            labelStyle={{ fontWeight: 'bold' }}
                        />
                        {learnerProfiles.map((learner) => (
                            <Line
                                key={learner.email}
                                type="monotone"
                                dataKey={learner.email}
                                stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                                dot={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default LineTimeChartCumulative;