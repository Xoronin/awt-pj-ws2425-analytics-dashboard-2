import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { XAPIStatement, LearnerProfile }  from '../../types/types';

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
        const allDates = Array.from(new Set(sortedStatements.map(s => new Date(s.timestamp).toISOString().split("T")[0])));

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
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
                <XAxis dataKey="name" />
                <YAxis label={{ value: "Minuten", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                {learnerProfiles.map((learner) => (
                    <Line 
                        key={learner.email} 
                        type="monotone" 
                        dataKey={learner.email} 
                        stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`} 
                        dot={false} 
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default LineTimeChartCumulative;
