import React from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Grid, Divider } from '@mui/material';
import { LearningSession, Verb, XAPIStatement, CourseData } from '../types/types';

interface StatisticsProps {
    sessions: Map<string, LearningSession[]>;
    statements: XAPIStatement[];
    verbs: Verb[];
    courseData: CourseData;
}

const XAPIStatistics = ({ sessions, statements, verbs, courseData }: StatisticsProps) => {
    const calculateStatistics = () => {
        let totalSessions = 0;
        let totalActivities = 0;
        let totalDuration = 0;
        let totalScores = 0;
        let scoredActivities = 0;
        let activityUsageByLearner: Map<string, Set<string>> = new Map();
        let completedActivitiesByLearner: Map<string, Set<string>> = new Map();
        let sectionUsageByLearner: Map<string, Set<string>> = new Map();
        let sessionsPerLearner: Map<string, number> = new Map();
        let averageActivitiesPerSession: number[] = [];
        let verbUsage: Record<string, number> = {};


        //sessions.forEach((learnerSessions) => {
        //    totalSessions += learnerSessions.length;

        //    learnerSessions.forEach(session => {
        //        totalDuration += session.totalDuration;
        //        averageActivitiesPerSession.push(session.activities.length);

        //        session.activities.forEach(activity => {
        //            totalActivities++;
        //            if (activity.completed) completedActivities++;

        //            // Track scores from scored interactions
        //            activity.interactions.forEach(interaction => {
        //                if (interaction.result?.score?.raw !== undefined) {
        //                    totalScores += interaction.result.score.raw;
        //                    scoredActivities++;
        //                }
        //            });

        //            // Track activity usage
        //            const activityId = activity.activity.id;
        //            activityUsage[activityId] = (activityUsage[activityId] || 0) + 1;

        //            // Track section usage
        //            const section = courseData.sections.find(s =>
        //                s.activities.some(a => a.id === activityId)
        //            );
        //            if (section) {
        //                sectionUsage[section.title] = (sectionUsage[section.title] || 0) + 1;
        //            }

        //            // Track verb usage
        //            activity.interactions.forEach(interaction => {
        //                const verbId = interaction.verb.id;
        //                verbUsage[verbId] = (verbUsage[verbId] || 0) + 1;
        //            });
        //        });
        //    });
        //});

        // Initialize activity usage tracking for each learner
        sessions.forEach((_, learnerId) => {
            activityUsageByLearner.set(learnerId, new Set());
            sectionUsageByLearner.set(learnerId, new Set());
            completedActivitiesByLearner.set(learnerId, new Set());
        });

        sessions.forEach((learnerSessions, learnerId) => {
            totalSessions += learnerSessions.length;
            sessionsPerLearner.set(learnerId, learnerSessions.length);
            const learnerActivitySet = activityUsageByLearner.get(learnerId)!;
            const learnerSectionSet = sectionUsageByLearner.get(learnerId)!;
            const learnerCompletedSet = completedActivitiesByLearner.get(learnerId)!;

            learnerSessions.forEach(session => {
                totalDuration += session.totalDuration;
                averageActivitiesPerSession.push(session.activities.length);

                session.activities.forEach(activity => {
                    totalActivities++;
                    if (activity.completed) {
                        learnerCompletedSet.add(activity.activity.id);
                    }

                    activity.interactions.forEach(interaction => {
                        if (interaction.result?.score?.raw !== undefined) {
                            totalScores += interaction.result.score.raw;
                            scoredActivities++;
                        }
                    });

                    learnerActivitySet.add(activity.activity.id);

                    const section = courseData.sections.find(s =>
                        s.activities.some(a => a.id === activity.activity.id)
                    );
                    if (section) {
                        learnerSectionSet.add(section.title);
                    }

                    activity.interactions.forEach(interaction => {
                        const verbId = interaction.verb.id;
                        verbUsage[verbId] = (verbUsage[verbId] || 0) + 1;
                    });
                });
            });
        });

        // Convert activity usage per learner to total unique usage counts
        const activityUsage: Record<string, number> = {};
        activityUsageByLearner.forEach((activitySet) => {
            activitySet.forEach((activityId) => {
                activityUsage[activityId] = (activityUsage[activityId] || 0) + 1;
            });
        });

        // Convert section usage per learner to total unique usage counts
        const sectionUsage: Record<string, number> = {};
        sectionUsageByLearner.forEach((sectionSet) => {
            sectionSet.forEach((sectionTitle) => {
                sectionUsage[sectionTitle] = (sectionUsage[sectionTitle] || 0) + 1;
            });
        });

        const avgSessionDuration = totalDuration / totalSessions;
        const avgActivitiesPerSession = averageActivitiesPerSession.reduce((a, b) => a + b, 0) / averageActivitiesPerSession.length;
        const averageScore = scoredActivities > 0 ? totalScores / scoredActivities : 0;
        const avgCompletedPerLearner = Array.from(completedActivitiesByLearner.values())
            .reduce((acc, set) => acc + set.size, 0) / sessions.size;
        const avgSessionsPerLearner = totalSessions / sessions.size;

        return {
            totalSessions,
            totalActivities,
            avgSessionDuration,
            avgActivitiesPerSession,
            averageScore,
            activityUsage,
            verbUsage,
            sectionUsage,
            totalStatements: statements.length,
            uniqueLearners: sessions.size,
            statementsPerLearner: statements.length / sessions.size,
            scoredActivities,
            avgCompletedPerLearner,
            avgSessionsPerLearner
        };
    };

    const stats = calculateStatistics();

    const StatBlock = ({ title, value, unit = '' }: { title: string; value: number | string; unit?: string }) => (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
                {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
                {typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value}
                {unit}
            </Typography>
        </Box>
    );

    const UsageList = ({
        title,
        data,
        getLabel,
        getDescription
    }: {
        title: string;
        data: Record<string, number>;
        getLabel: (key: string) => string;
        getDescription?: (key: string) => string;
    }) => (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Object.entries(data)
                    .sort(([, a], [, b]) => b - a)
                    .map(([key, count]) => (
                        <Box key={key} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {getLabel(key)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {count} uses
                                </Typography>
                            </Box>
                            {getDescription && (
                                <Typography variant="body2" color="text.secondary">
                                    {getDescription(key)}
                                </Typography>
                            )}
                            <Box sx={{
                                width: '100%',
                                height: 4,
                                bgcolor: 'grey.200',
                                mt: 1,
                                borderRadius: 2,
                                overflow: 'hidden'
                            }}>
                                <Box sx={{
                                    height: '100%',
                                    width: `${(count / Math.max(...Object.values(data))) * 100}%`,
                                    bgcolor: 'primary.main',
                                    borderRadius: 2
                                }} />
                            </Box>
                        </Box>
                    ))}
            </Box>
        </Box>
    );

    const getActivityDetails = (activityId: string) => {
        for (const section of courseData.sections) {
            const activity = section.activities.find(a => a.id === activityId);
            if (activity) {
                return {
                    name: activity.title,
                    description: `${section.title} - Duration: ${activity.estimatedDuration}min`
                };
            }
        }
        return { name: activityId, description: 'Unknown Activity' };
    };

    return (
        <Card sx={{ mt: 4 }}>
            <CardHeader
                title="Learning Analytics Dashboard"
                sx={{ bgcolor: 'grey.100', borderBottom: 1, borderColor: 'grey.300' }}
            />
            <CardContent>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <StatBlock title="Total xAPI Statements" value={stats.totalStatements} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatBlock title="Total Learning Sessions" value={stats.totalSessions} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatBlock title="Average Session Duration" value={stats.avgSessionDuration} unit=" min" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatBlock title="Average Score" value={stats.averageScore} unit="%" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatBlock title="Average Statements per Learner" value={stats.statementsPerLearner} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatBlock title="Average Sessions per Learner" value={stats.avgSessionsPerLearner} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatBlock title="Average Completed Activities per Learner" value={stats.avgCompletedPerLearner} />
                    </Grid>
                </Grid>

                <Grid container spacing={4} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={4}>
                        <UsageList
                            title="Course Sections Usage"
                            data={stats.sectionUsage}
                            getLabel={(title) => title}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <UsageList
                            title="Most Used Activities"
                            data={stats.activityUsage}
                            getLabel={(id) => getActivityDetails(id).name}
                            getDescription={(id) => getActivityDetails(id).description}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <UsageList
                            title="Learning Actions Distribution"
                            data={stats.verbUsage}
                            getLabel={(id) => verbs.find(v => v.id === id)?.prefLabel || id}
                            getDescription={(id) => verbs.find(v => v.id === id)?.definition || ''}
                        />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default XAPIStatistics;