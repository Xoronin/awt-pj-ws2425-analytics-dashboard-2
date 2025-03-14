import {
    Cancel as FailedIcon, CheckCircle as CompletedIcon
} from '@mui/icons-material';
import {
    Box, Paper, Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow, Typography
} from '@mui/material';
import React, { useMemo } from 'react';
import { CourseData, LearnerProfile, XAPIStatement } from '../../types/types';
import { ParseDuration } from '../../helper/helper';

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

/**
 * Displays a learner's activity history in a sortable table format.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {LearnerProfile} props.learner - The learner profile data
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {CourseData} props.courseData - Structured course data containing sections and activities
 * 
 * @returns {React.ReactElement} A table displaying the learner's activity history
 */
const ActivityHistory: React.FC<ActivityHistoryProps> = ({
    learner,
    statements,
    courseData
}) => {

    const learnerActivities = useMemo(() => {
        const activityPerformance: Record<string, ActivityPerformance> = {};

        const learnerStatements = statements.filter(
            statement => statement.actor.mbox === learner.email
        );

        learnerStatements.forEach(statement => {
            const activityId = statement.object.definition.extensions?.[
                'https://w3id.org/learning-analytics/learning-management-system/external-id'
            ];

            if (!activityId) return;

            if (!activityPerformance[activityId]) {
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

            performance.attempts++;

            if (statement.result?.score?.raw !== undefined) {
                performance.scores.push(statement.result.score.raw);

                if (statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed' ||
                    statement.verb.id === 'http://adlnet.gov/expapi/verbs/passed') {
                    performance.completed = true;
                    performance.completionScore = statement.result.score.raw;
                }
            }

            if (!(statement.verb.id === "http://adlnet.gov/expapi/verbs/completed") && statement.result?.duration) {
                performance.totalDuration += ParseDuration(statement.result.duration);
            }

        });

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
                    paddingRight: 0.5,
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
                    }
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