import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, CourseData, LearnerProfile } from '../../types/types';

interface CourseCompletionProps {
    statements: XAPIStatement[];
    courseData: CourseData;
    learner: LearnerProfile;
}

/**
 * Visualizes a learner's course completion progress as a donut chart.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {CourseData} props.courseData - Structured course data containing sections and activities
 * @param {LearnerProfile} props.learner - The learner profile data
 * 
 * @returns {React.ReactElement} A donut chart displaying completed vs. remaining activities
 */
const CourseCompletion: React.FC<CourseCompletionProps> = ({
    statements,
    courseData,
    learner
}) => {
    const theme = useTheme();

    const COLORS = ['#1565C0', '#90CAF9 '];

    /**
     * Calculates course completion data from xAPI statements and course structure.
     * Considers an activity completed if it has either a "completed" verb or completion=true.
     * 
     * @returns {Array} Array with two objects representing completed and remaining activities
     * @property {string} name - Label for the segment ("Completed" or "Remaining")
     * @property {number} value - Count of activities in this category
     */
    const completionData = useMemo(() => {
        const completedActivities = new Set<string>();

        statements
            .filter(statement => statement.actor.mbox === learner.email)
            .forEach(statement => {
                const activityId = statement.object.definition.extensions?.[
                    'https://w3id.org/learning-analytics/learning-management-system/external-id'
                ];

                const isCompleted =
                    (statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed') ||
                    (statement.result?.completion === true);

                if (isCompleted && activityId) {
                    completedActivities.add(activityId);
                }
            });

        const totalActivities = courseData.sections.reduce((acc, section) =>
            acc + section.activities.length, 0
        );

        const completedCount = completedActivities.size;
        return [
            { name: 'Completed', value: completedCount },
            { name: 'Remaining', value: totalActivities - completedCount }
        ];
    }, [statements, courseData]);

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <Typography
                sx={{
                    fontSize: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#1565C0',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}
            >
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
                        innerRadius="60%"
                        outerRadius="80%"
                        fill={theme.palette.primary.main}
                        dataKey="value"
                    >
                        <Label value={`${completionData[0].value}/${completionData[0].value + completionData[1].value}`} position="center" fontSize={20} fontWeight="bold" fill="#1565C0" />
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