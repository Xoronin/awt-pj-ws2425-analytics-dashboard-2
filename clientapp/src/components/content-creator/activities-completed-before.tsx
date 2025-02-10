import React, { useMemo } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { XAPIStatement } from '../../types/types';

interface ActivitiesCompletedBeforeProps {
    statements: XAPIStatement[];
    courseData: any; // Define the appropriate type for courseData if available
    SelectedCourseName: string;
}

const ActivitiesCompletedBefore: React.FC<ActivitiesCompletedBeforeProps> = ({
    statements,
    courseData,
    SelectedCourseName,
}) => {
    // Find the ActivityId for the selected course name (current course)
    const activityId = useMemo(() => {
        const activity = courseData.sections.find((s: any) =>
            s.activities.find((a: any) => a.title === SelectedCourseName)
        )?.activities.find((a: any) => a.title === SelectedCourseName);
        return activity?.id; // Return the id of the found activity, or undefined if not found
    }, [courseData, SelectedCourseName]);

    // Get the course title by activityId
    const getCourseTitleById = (id: string) => {
        const activity = courseData.sections
            .flatMap((section: any) => section.activities)
            .find((activity: any) => activity.id === id);
        return activity?.title || id; // Return the title or id if not found
    };

    // Process the statements to count how many students completed each course before the selected course
    const { coursesCompletedBefore, totalStudents } = useMemo(() => {
        if (!activityId) return { coursesCompletedBefore: {}, totalStudents: 0 };

        // Store the count of students who completed each course before the current course
        const courseCompletionCounts: { [key: string]: Set<string> } = {}; // Using a Set to ensure unique students
        const allStudents = new Set<string>(); // Track all unique students

        // Separate students into two cases:
        const studentsCompletedCurrentCourse = new Set<string>(); // Store students who have completed the current course

        // Process all statements
        statements.forEach((statement) => {
            if (statement.verb.id !== 'http://adlnet.gov/expapi/verbs/completed') return; // Only consider "completed" verbs

            const completedActivityId = statement.object.definition.extensions?.[
                'https://w3id.org/learning-analytics/learning-management-system/external-id'
            ];

            if (!completedActivityId) return;

            // Track all students
            const studentEmail = statement.actor.mbox;
            allStudents.add(studentEmail);

            // Check if the student completed the current course
            if (completedActivityId === activityId) {
                studentsCompletedCurrentCourse.add(studentEmail);
            } else {
                if (studentsCompletedCurrentCourse.has(studentEmail)) {
                    // Case 2: The student has completed the current course, so we check timestamps
                    const currentCourseTimestamp = statements
                        .filter(
                            (s) =>
                                s.verb.id === 'http://adlnet.gov/expapi/verbs/completed' &&
                                s.object.definition.extensions?.[
                                'https://w3id.org/learning-analytics/learning-management-system/external-id'
                                ] === activityId
                        )
                        .map((s) => s.timestamp)[0];

                    if (new Date(statement.timestamp) < new Date(currentCourseTimestamp)) {
                        // The student completed this course before the current course
                        if (!courseCompletionCounts[completedActivityId]) {
                            courseCompletionCounts[completedActivityId] = new Set();
                        }
                        courseCompletionCounts[completedActivityId].add(studentEmail);
                    }
                } else {
                    // Case 1: The student has not completed the current course
                    if (!courseCompletionCounts[completedActivityId]) {
                        courseCompletionCounts[completedActivityId] = new Set();
                    }
                    courseCompletionCounts[completedActivityId].add(studentEmail);
                }
            }
        });

        // Calculate the total number of unique students
        const totalStudents = allStudents.size;

        // Convert Set to count the unique students and calculate percentages
        const result = Object.fromEntries(
            Object.entries(courseCompletionCounts).map(([key, value]) => [
                key,
                {
                    count: value.size,
                    percentage: (value.size / totalStudents) * 100,
                },
            ])
        );

        return { coursesCompletedBefore: result, totalStudents };
    }, [statements, activityId, courseData]);

    // Sort the courses by percentage in descending order
    const sortedCourses = useMemo(() => {
        return Object.entries(coursesCompletedBefore)
            .sort(([, a], [, b]) => b.percentage - a.percentage)
            .map(([activityId, { count, percentage }]) => ({
                activityId,
                count,
                percentage,
                title: getCourseTitleById(activityId),
            }));
    }, [coursesCompletedBefore]);

    return (
        <Box sx={{
            height: 'calc(100% - 32px)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingRight: 1,
            paddingLeft: 1,
            maxHeight: '100%',
            minHeight: 0,
            '& .MuiTableContainer-root': {
                mb: 2
            },
            '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px'
            },
            '&::-webkit-scrollbar-track': {
                background: '#E8F5E9'  
            },
            '&::-webkit-scrollbar-thumb': {
                background: '#4CAF50',  
                borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
                background: '#2E7D32' 
            }
        }}
        >
            <Typography
                sx={{
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#2E7D32',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    mb: 2,
                }}
            >
                Activities Completed Before {SelectedCourseName}
            </Typography>

            {
                sortedCourses.length === 0 ? (
                    <Typography variant="body1" sx={{ color: '#388E3C' }}>
                        No courses completed before the current course.
                    </Typography>
                ) : (
                    sortedCourses.map(({ activityId, count, percentage, title }) => (
                        <Box key={activityId} sx={{ marginBottom: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {title}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: '#C8E6C9',
                                    '& .MuiLinearProgress-bar': {
                                        background: 'linear-gradient(90deg, #2E7D32, #66BB6A)',
                                    },
                                }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                                <Typography variant="body2">
                                    {count} student{count > 1 ? 's' : ''}
                                </Typography>
                                <Typography variant="body2">
                                    {percentage.toFixed(1)}%
                                </Typography>
                            </Box>
                        </Box>
                    ))

                )
            }
        </Box >
    );
};

export default ActivitiesCompletedBefore;
