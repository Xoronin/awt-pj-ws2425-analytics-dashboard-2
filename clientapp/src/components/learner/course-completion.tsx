import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, CourseData, LearnerProfile } from '../../types/types';

interface CourseCompletionProps {
    statements: XAPIStatement[];
    courseData: CourseData;
    learner: LearnerProfile;
}

const CourseCompletion: React.FC<CourseCompletionProps> = ({
    statements,
    courseData,
    learner
}) => {
    const theme = useTheme();

    const completionData = useMemo(() => {
        // Get completed activities from xAPI statements for this learner
        const completedActivities = new Set<string>();

        statements
            .filter(statement => statement.actor.mbox === learner.email)
            .forEach(statement => {
                // Extract activity ID from the extensions
                const activityId = statement.object.definition.extensions?.[
                    'https://w3id.org/learning-analytics/learning-management-system/external-id'
                ];

                // Check for completion either through verb or result field
                const isCompleted =
                    (statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed') ||
                    (statement.result?.completion === true);

                if (isCompleted && activityId) {
                    completedActivities.add(activityId);
                }
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
    }, [statements, courseData]);

    const COLORS = [theme.palette.success.main, theme.palette.grey[500]];

    const completionPercentage = Math.round(
        (completionData[0].value / (completionData[0].value + completionData[1].value)) * 100
    );

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <Typography variant="body1" gutterBottom>
                Course Completion
            </Typography>

            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={completionData}
                        cx="50%"
                        cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        labelLine={false}
                        innerRadius={80}
                        outerRadius={100}
                        fill={theme.palette.primary.main}
                        dataKey="value"
                    >
                        <Label value={`${completionData[0].value}/${completionData[0].value + completionData[1].value}`} position="center" fontSize={20} fontWeight="bold" fill="000000" />
                        {completionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} Activities`, name]} />
                    <Legend verticalAlign="bottom" height={56} />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default CourseCompletion;