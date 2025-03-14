import React, { useMemo } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { XAPIStatement } from '../../types/types';

/**
 * Props interface for the ActivitiesCompletedBefore component
 * @interface ActivitiesCompletedBeforeProps
 * @property {XAPIStatement[]} statements - Array of xAPI statements containing completion data
 * @property {any} courseData - Data structure containing course sections and activities
 * @property {string} SelectedCourseName - Name of the currently selected course
 */
interface ActivitiesCompletedBeforeProps {
    statements: XAPIStatement[];
    courseData: any; 
    SelectedCourseName: string;
}

/**
 * Component that shows which activities were completed before the selected course
 * 
 * This component analyzes xAPI statements to determine which courses students completed
 * prior to the currently selected course, displaying them as a sorted list with
 * progress bars indicating the percentage of students who completed each activity.
 * 
 * @component
 * @param {ActivitiesCompletedBeforeProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const ActivitiesCompletedBefore: React.FC<ActivitiesCompletedBeforeProps> = ({
    statements,
    courseData,
    SelectedCourseName,
}) => {

    /**
     * Finds the activity ID for the selected course name
     * 
     * @returns {string|undefined} The ID of the selected course activity
     */
    const activityId = useMemo(() => {
        const activity = courseData.sections.find((s: any) =>
            s.activities.find((a: any) => a.title === SelectedCourseName)
        )?.activities.find((a: any) => a.title === SelectedCourseName);
        return activity?.id; 
    }, [courseData, SelectedCourseName]);

    /**
     * Retrieves the course title from its ID
     * 
     * @param {string} id - The activity ID to look up
     * @returns {string} The title of the activity or the ID if not found
     */
    const getCourseTitleById = (id: string) => {
        const activity = courseData.sections
            .flatMap((section: any) => section.activities)
            .find((activity: any) => activity.id === id);
        return activity?.title || id; 
    };

    /**
     * Processes xAPI statements to determine activities completed before the selected course
     * 
     * This complex data processing:
     * 1. Identifies students who completed the current course
     * 2. For each student, finds which other courses they completed before the current one
     * 3. Calculates completion counts and percentages for each activity
     * 
     * @returns {Object} Object containing completion data and total student count
     */
    const { coursesCompletedBefore, totalStudents } = useMemo(() => {
        if (!activityId) return { coursesCompletedBefore: {}, totalStudents: 0 };

        const courseCompletionCounts: { [key: string]: Set<string> } = {}; 
        const allStudents = new Set<string>();

        const studentsCompletedCurrentCourse = new Set<string>(); 

        statements.forEach((statement) => {
            if (statement.verb.id !== 'http://adlnet.gov/expapi/verbs/completed') return; 

            const completedActivityId = statement.object.definition.extensions?.[
                'https://w3id.org/learning-analytics/learning-management-system/external-id'
            ];

            if (!completedActivityId) return;

            const studentEmail = statement.actor.mbox;
            allStudents.add(studentEmail);

            if (completedActivityId === activityId) {
                studentsCompletedCurrentCourse.add(studentEmail);
            } else {
                if (studentsCompletedCurrentCourse.has(studentEmail)) {
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
                        if (!courseCompletionCounts[completedActivityId]) {
                            courseCompletionCounts[completedActivityId] = new Set();
                        }
                        courseCompletionCounts[completedActivityId].add(studentEmail);
                    }
                } else {
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

    /**
     * Sorts courses by completion percentage and adds titles
     * 
     * @returns {Array<{activityId: string, count: number, percentage: number, title: string}>}
     *          Sorted array of course completion data
     */
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
            height: 'calc(100% - 56px)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingRight: 1,
            maxHeight: '100%',
            minHeight: 0,
            backgroundColor: 'transparent',
            '& .MuiTableContainer-root': {
                mb: 2
            },
            '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
                background: '#FBC02D',
                borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
                background: '#F57F17'
            }
        }}
        >
            {
                sortedCourses.length === 0 ? (
                    <Typography variant="body1" >
                        No courses completed before the current course.
                    </Typography>
                ) : (
                    sortedCourses.map(({ activityId, count, percentage, title }) => (
                        <Box key={activityId} sx={{
                            marginBottom: 1,
                            p: 1,
                            bgcolor: '#FFF9C4',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: '#FFD54F',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                            display: 'flex',
                            flexDirection: 'column',
                            flex: '0 0 auto',
                            minHeight: '30px',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 2,
                                cursor: 'pointer',
                                bgcolor: '#FFECB3'
                            }
                        }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {title}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: '#FFF3E0',
                                    '& .MuiLinearProgress-bar': {
                                        background: 'linear-gradient(90deg, #FFEB3B, #FFC107)'
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