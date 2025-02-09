import React, { useMemo, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    CheckCircle as CompletedIcon,
    Cancel as FailedIcon
} from '@mui/icons-material';
import { CourseData, LearnerProfile, XAPIStatement } from '../../types/types';
import { stat } from 'fs';

interface ActivityHistoryProps {
    learner: LearnerProfile;
    statements: XAPIStatement[];
    courseData: CourseData;
}

interface ActivityPerformance {
    activityId: string;
    title: string;
    section: string;
    attempts: number;
    completed: boolean;
    scores: number[];
    completionScore: number;
    totalDuration: number;
    lastAttemptDate: Date;
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({
    learner,
    statements,
    courseData
}) => {

    // Helper function to parse ISO 8601 duration
    const parseDuration = (duration: string): number => {
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 15; // default to 15 minutes

        const [, hours, minutes, seconds] = matches;
        return (
            (parseInt(hours || '0') * 60) +
            parseInt(minutes || '0') +
            Math.ceil(parseInt(seconds || '0') / 60)
        );
    };

    // Memoized calculation of learner's activity performance
    const learnerActivities = useMemo(() => {
        // Tracking structure for activity performance
        const activityPerformance: Record<string, ActivityPerformance> = {};

        // Filter statements for the selected learner
        const learnerStatements = statements.filter(
            statement => statement.actor.mbox === learner.email
        );

        learnerStatements.forEach(statement => {
            const activityId = statement.object.definition.extensions?.[
                'https://w3id.org/learning-analytics/learning-management-system/external-id'
            ];

            if (!activityId) return;

            // Initialize activity performance tracking
            if (!activityPerformance[activityId]) {
                // Find activity details
                let activityDetails = null;
                for (const section of courseData.sections) {
                    const activity = section.activities.find(a => a.id === activityId);
                    if (activity) {
                        activityDetails = { ...activity, section: section.title };
                        break;
                    }
                }

                if (!activityDetails) return;

                activityPerformance[activityId] = {
                    activityId,
                    title: activityDetails.title,
                    section: activityDetails.section,
                    attempts: 0,
                    completed: false,
                    scores: [],
                    completionScore: 0,
                    totalDuration: 0,
                    lastAttemptDate: new Date(0)
                };
            }

            const performance = activityPerformance[activityId];

            // Track attempts
            performance.attempts++;

            // Track scores
            if (statement.result?.score?.raw !== undefined) {
                performance.scores.push(statement.result.score.raw);

                // If this is a completion or passed statement, store the score as completion score
                if (statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed' ||
                    statement.verb.id === 'http://adlnet.gov/expapi/verbs/passed') {
                    performance.completed = true;
                    performance.completionScore = statement.result.score.raw;
                }
            }

            // Track duration
            if (!(statement.verb.id === "http://adlnet.gov/expapi/verbs/completed") && statement.result?.duration) {
                performance.totalDuration += parseDuration(statement.result.duration);
            }

        });

        // Convert to sorted array
        return Object.values(activityPerformance)
            .sort((a, b) => b.lastAttemptDate.getTime() - a.lastAttemptDate.getTime());
    }, [learner, statements, courseData]);

    return (
        <Box sx={{
            height: 'calc(100% - 32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            paddingRight: 1,
            paddingLeft: 1,
            paddingBottom: 2,
            maxHeight: '100%',
            minHeight: 0,
            '& .MuiTableContainer-root': {
                mb: 3  
            },
            pb: 3
        }}>
            <TableContainer
                component={Paper}
                sx={{
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    minHeight: 0,
                    marginBottom: 2,
                    backgroundColor: 'transparent',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px'
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#FFF9C4'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#FBC02D',
                        borderRadius: '4px'
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: '#F57F17'
                    },
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#FBC02D #FFF9C4'
                }}
            >
                <Table stickyHeader size="small" sx={{
                    '& .MuiTableCell-root': {
                        padding: '6px 3px',
                        fontSize: '0.9rem'
                    },
                    '& .MuiTableCell-head': {
                        backgroundColor: '#FFF176', 
                        color: 'rgba(0, 0, 0, 0.87)'
                    },
                    width: '100%'
                }}>

                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', width: '40%' }}>Activity</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', width: '30%' }}>Section</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', width: '10%' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', width: '10%'}}>Score</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', width: '10%'}}>Duration</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {learnerActivities.map(activity => (
                        <TableRow key={activity.activityId} hover
                            sx={{
                                '&:last-child td': { border: 0 },
                                transition: 'background-color 0.2s',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,152,0,0.1)'
                                }
                            }}>
                            <TableCell>{activity.title}</TableCell>
                            <TableCell>{activity.section}</TableCell>
                            <TableCell>
                                {activity.completed ? (
                                    <CompletedIcon
                                        color="success"
                                        sx={{ fontSize: '1.5rem' }}
                                    />
                                ) : (
                                    <FailedIcon
                                        color="error"
                                        sx={{ fontSize: '1.5rem' }}
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <Typography sx={{ mr: 1 }}>
                                    {activity.completed && activity.completionScore !== null
                                        ? `${activity.completionScore.toFixed(1)}%`
                                        :  'No score'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {activity.totalDuration.toFixed(0)} min
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </TableContainer>
        </Box>
    );
};

export default ActivityHistory;