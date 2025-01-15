import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, CourseData, LearnerProfile, Activity, LearningSession } from '../../types/types';

interface CourseCompletionProps {
    statements: XAPIStatement[];
    courseData: CourseData;
    learner: LearnerProfile;
    sessions: Map<string, LearningSession[]>;
}

const CourseCompletion: React.FC<CourseCompletionProps> = ({
    statements,
    courseData,
    learner,
    sessions
}) => {
    const theme = useTheme();

    const completionData = useMemo(() => {
        // Get learner's sessions
        const learnerSessions = sessions.get(learner.id) || [];

        // Get completed activities from sessions
        const completedActivities = new Set<string>();
        learnerSessions.forEach(session => {
            session.activities.forEach(activity => {
                if (activity.completed) {
                    completedActivities.add(activity.activity.id);
                }
            });
        });

        // Get total activities count
        const totalActivities = courseData.sections.reduce((acc, section) =>
            acc + section.activities.length, 0
        );

        const completedCount = completedActivities.size;
        return [
            { name: 'Completed', value: completedCount },
            { name: 'Remaining', value: totalActivities - completedCount }
        ];
    }, [sessions, courseData, learner.id]);

    const COLORS = [theme.palette.success.main, theme.palette.grey[300]];

    const completionPercentage = Math.round(
        (completionData[0].value / (completionData[0].value + completionData[1].value)) * 100
    );

    return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={completionData}
                        cx="50%"
                        cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        labelLine={false}
                        outerRadius={120}
                        innerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {completionData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value, name) => [`${value} Activities`, name]}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Centered percentage */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none' 
                }}
            >
                <Typography variant="h4" sx={{ color: theme.palette.success.main }}>
                    {completionPercentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {completionData[0].value}/{completionData[0].value + completionData[1].value}
                </Typography>
            </Box>
        </Box>
    );
};

export default CourseCompletion;