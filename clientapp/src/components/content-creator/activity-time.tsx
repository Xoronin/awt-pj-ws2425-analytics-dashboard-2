import React, { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, CourseData } from '../../types/types';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

/**
 * Props interface for the ActivityTime component
 * @interface ActivityTimeProps
 * @property {XAPIStatement[]} statements - Array of xAPI statements containing completion time data
 * @property {CourseData} courseData - Data about the course structure and typical learning times
 */
interface ActivityTimeProps {
    statements: XAPIStatement[];
    courseData: CourseData;
}

/**
 * Parses an ISO 8601 duration string and converts it to minutes
 * 
 * @param {string} duration - ISO 8601 duration string (e.g., "PT1H30M15S")
 * @returns {number} Total duration in minutes
 */
const parseDuration = (duration: string): number => {
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return 15; 

    const [, hours, minutes, seconds] = matches;
    return (
        (parseInt(hours || '0') * 60) +
        parseInt(minutes || '0') +
        Math.ceil(parseInt(seconds || '0') / 60)
    );
};

/**
 * Component that displays a histogram of student learning time distribution
 * 
 * This component analyzes xAPI statements to extract time spent by students on activities,
 * then creates a histogram showing the distribution of learning times across all students.
 * 
 * @component
 * @param {ActivityTimeProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const ActivityTime: React.FC<ActivityTimeProps> = ({ statements, courseData }) => {
    const theme = useTheme();

    const activityId = statements[0]?.object.definition.extensions?.[
        'https://w3id.org/learning-analytics/learning-management-system/external-id'
    ];

    /**
     * Retrieves the typical learning time for the current activity from course data
     * 
     * @returns {string|null} The typical learning time for the activity or null if not found
     */
    const activityTypicalTime = useMemo(() => {
        if (activityId && courseData.sections) {
            const section = courseData.sections.find((s) =>
                s.activities.some((a) => a.id === activityId)
            );

            if (section) {
                const activity = section.activities.find((a) => a.id === activityId);
                return activity?.typicalLearningTime || null; 
            }
        }
        return null; 
    }, [activityId, courseData]);

    console.log('Typical Learning Time:', activityTypicalTime);

    /**
     * Processes xAPI statements to calculate total learning time for each student
     * 
     * This function:
     * 1. Finds completed statements with duration information
     * 2. Parses the ISO duration strings to minutes
     * 3. Aggregates times per student
     * 
     * @returns {Array<{email: string, totalTime: number}>} Array of student learning times
     */
    const learningTimes = useMemo(() => {
        const timePerStudent: { [email: string]: number } = {}; 

        statements.forEach((statement) => {
            if (
                statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed' && 
                statement.result?.duration
            ) {
                const duration = parseDuration(statement.result.duration);

                const learnerEmail = statement.actor.mbox;

                if (!timePerStudent[learnerEmail]) {
                    timePerStudent[learnerEmail] = 0;
                }

                timePerStudent[learnerEmail] += duration; 
            }
        });

        return Object.entries(timePerStudent).map(([email, totalTime]) => ({
            email,
            totalTime,
        }));
    }, [statements]);

    /**
     * Creates histogram data from student learning times
     * 
     * This function:
     * 1. Calculates min and max learning times across all students
     * 2. Creates time range buckets (e.g., "10-20 min")
     * 3. Counts how many students fall into each time range
     * 
     * @returns {Array<{name: string, count: number}>} Histogram data for visualization
     */
    const histogramData = useMemo(() => {
        if (learningTimes.length === 0) return []; 

        const minTime = Math.min(...learningTimes.map(entry => entry.totalTime));
        const maxTime = Math.max(...learningTimes.map(entry => entry.totalTime));

        const bucketCount = 10;
        const bucketSize = Math.ceil((maxTime - minTime) / bucketCount);

        const timeRanges = Array.from({ length: bucketCount }, (_, index) => {
            const start = minTime + index * bucketSize;
            const end = Math.min(start + bucketSize - 1, maxTime);
            return {
                name: `${start}-${end} min`,
                count: 0,
            };
        });

        learningTimes.forEach((entry) => {
            const totalTime = entry.totalTime;

            timeRanges.forEach((bucket) => {
                const [start, end] = bucket.name.split('-').map(n => parseInt(n));
                if (totalTime >= start && totalTime <= end) {
                    bucket.count++;
                }
            });
        });

        return timeRanges;
    }, [learningTimes]);

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
                    color: theme.palette.primary.main,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    mb: 1
                }}
            >
                Learning Time Distribution (in min)
            </Typography>

            <Box sx={{
                flex: 1,
                minHeight: 0,
                width: '100%',
                pb: 2 
            }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={histogramData}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 30
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            label={{
                                value: 'Learning Time Range',
                                position: 'insideBottom',
                                offset: -15,
                                style: { fontSize: '0.8em' }
                            }}
                            tick={{ fontSize: '0.75em' }}
                        />
                        <YAxis
                            label={{
                                value: 'Number of Students',
                                angle: -90,
                                position: 'insideLeft',
                                style: { fontSize: '0.8em' },
                                offset: 15,
                                dy: 50
                            }}
                            tick={{ fontSize: '0.75em' }}
                        />
                        <Tooltip
                            contentStyle={{ fontSize: '0.8em' }}
                        />
                        <Bar dataKey="count" fill={theme.palette.primary.main} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default ActivityTime;
