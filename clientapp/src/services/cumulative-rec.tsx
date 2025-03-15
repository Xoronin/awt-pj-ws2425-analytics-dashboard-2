import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { XAPIStatement, LearnerProfile } from '../types/types';
import { ParseDuration } from '../helper/helper';

interface CumulativeRecProps {
    statements: XAPIStatement[];
    learnerProfiles: LearnerProfile[];
}

/**
 * Interface for student activity analysis
 * @interface StudentActivity
 * @property {string} email - Student's email identifier
 * @property {number} totalTime - Total learning time in minutes
 * @property {number} activeDays - Number of days with learning activity
 * @property {number} totalDays - Total course duration in days
 * @property {number} activePercentage - Percentage of days active
 * @property {number} inactivityPeriod - Longest period of inactivity in days
 * @property {Date} inactivityStartDate - Start date of longest inactivity period
 * @property {Date} inactivityEndDate - End date of longest inactivity period
 */
interface StudentActivity {
    email: string;
    totalTime: number;
    activeDays: number;
    totalDays: number;
    activePercentage: number;
    inactivityPeriod: number;
    inactivityStartDate: Date;
    inactivityEndDate: Date;
}

const INACTIVITY_THRESHOLD_DAYS = 6;

const getDateString = (date: Date): string => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const getActivityColor = (percentage: number): string => {
    if (percentage >= 80) return '#4CAF50'; // Green
    if (percentage >= 60) return '#FFBB00'; // Yellow
    if (percentage >= 50) return '#F57C00'; // Dark Orange
    if (percentage >= 40) return '#D32F2F'; // Red
    return '#9F2F2F'; // Dark Red
};


/**
 * Identifies and displays students with significant periods of inactivity,
 * providing recommendations for educators to address inconsistent engagement.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {LearnerProfile[]} props.learnerProfiles - Array of learner profiles
 * 
 * @returns {React.ReactElement} A scrollable list of students with significant inactivity periods
 */
const CumulativeRec: React.FC<CumulativeRecProps> = ({ statements, learnerProfiles }) => {

    /**
     * Analyzes student activity patterns to identify periods of inactivity.
     * Tracks daily engagement and calculates the longest gaps between learning sessions.
     * 
     * @returns {StudentActivity[]} Array of students with significant inactivity periods
     */
    const inactiveStudents = useMemo(() => {
        const studentActivities: Record<string, { timestamp: Date; cumulativeTime: number }[]> = {};

        // Sort statements by timestamp
        const sortedStatements = [...statements].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let courseStartDate: Date | null = null;
        let courseEndDate: Date | null = null;

        if (sortedStatements.length > 0) {
            courseStartDate = new Date(sortedStatements[0].timestamp);
            courseEndDate = new Date(sortedStatements[sortedStatements.length - 1].timestamp);
        }

        sortedStatements.forEach((statement) => {
            const learnerEmail = statement.actor.mbox;
            const username = learnerEmail.split('@')[0];

            if (!studentActivities[username]) {
                studentActivities[username] = [];
            }

            const timestamp = new Date(statement.timestamp);
            const duration = statement.result?.duration ? ParseDuration(statement.result.duration) : 0;

            const previousCumulativeTime = studentActivities[username].length > 0
                ? studentActivities[username][studentActivities[username].length - 1].cumulativeTime
                : 0;

            studentActivities[username].push({
                timestamp,
                cumulativeTime: previousCumulativeTime + duration
            });
        });

        const studentsWithInactivity: StudentActivity[] = [];

        Object.entries(studentActivities).forEach(([username, activities]) => {

            if (activities.length < 2) {
                return;
            }

            let maxInactivityPeriod = 0;
            let inactivityStartDate: Date | null = null;
            let inactivityEndDate: Date | null = null;

            for (let i = 1; i < activities.length; i++) {
                const currentActivity = activities[i];
                const previousActivity = activities[i - 1];

                const daysBetween = (currentActivity.timestamp.getTime() - previousActivity.timestamp.getTime()) / (1000 * 3600 * 24);

                if (daysBetween > maxInactivityPeriod) {
                    maxInactivityPeriod = daysBetween;
                    inactivityStartDate = previousActivity.timestamp;
                    inactivityEndDate = currentActivity.timestamp;
                }
            }

            const totalTime = activities[activities.length - 1].cumulativeTime;

            const activeDaysSet = new Set<string>();
            activities.forEach(activity => {
                activeDaysSet.add(getDateString(activity.timestamp));
            });

            const activeDays = activeDaysSet.size;

            const firstActivity = activities[0].timestamp;
            const lastActivity = activities[activities.length - 1].timestamp;
            const totalDays = Math.ceil((lastActivity.getTime() - firstActivity.getTime()) / (1000 * 3600 * 24)) + 1;

            const activePercentage = (activeDays / totalDays) * 100;

            if (maxInactivityPeriod >= INACTIVITY_THRESHOLD_DAYS && inactivityStartDate && inactivityEndDate) {
                studentsWithInactivity.push({
                    email: username,
                    totalTime,
                    activeDays,
                    totalDays,
                    activePercentage,
                    inactivityPeriod: maxInactivityPeriod,
                    inactivityStartDate,
                    inactivityEndDate
                });
            }
        });

        return studentsWithInactivity;
    }, [statements]);

    return (
        <Box sx={{
            height: 'calc(100% - 56px)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            gap: 1,
            paddingRight: 1,
            maxHeight: '100%',
            minHeight: 0,
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
            },
        }}>
            {inactiveStudents.length > 0 ? (
                inactiveStudents.map((student, index) => (
                    <Box
                        key={index}
                        sx={{
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
                            ...(index === inactiveStudents.length - 1 && {
                                mb: 0.5
                            }),
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 2,
                                cursor: 'pointer',
                                bgcolor: '#FFECB3',
                            },
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                        }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: '#F57F17',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {student.email.replace('mailto:', '')}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    px: 1.5,
                                    py: 1.5,
                                    bgcolor: getActivityColor(student.activePercentage),
                                    color: 'white',
                                    borderRadius: 1,
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    lineHeight: 1,
                                }}
                            >
                                Active: {student.activeDays}/{student.totalDays} days
                            </Typography>
                        </Box>

                        <Typography
                            variant="body2"
                            sx={{
                                color: '#D32F2F',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                marginBottom: '8px',
                            }}
                        >
                            ⚠️ Inactivity detected! Student had a {Math.round(student.inactivityPeriod)}-day learning gap between {student.inactivityStartDate.toLocaleDateString()} and {student.inactivityEndDate.toLocaleDateString()}.
                        </Typography>

                    </Box>
                ))
            ) : (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                    textAlign: 'center',
                    p: 2,
                }}>
                    <Typography>
                        👍 All students are showing consistent engagement with no significant periods of inactivity.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default CumulativeRec;