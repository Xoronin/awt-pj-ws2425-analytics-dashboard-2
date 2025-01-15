import React, { useState } from 'react';
import { LearningSession, Verb, XAPIStatement, CourseData, LearnerProfile } from '../types/types';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Box,
    Grid,
    Tabs,
    Tab,
    Paper,
    LinearProgress,
} from '@mui/material';
import {
    BarChart as BarChartIcon,
    Timeline as TimelineIcon,
    School as SchoolIcon,
    Book as BookIcon,
    SvgIconComponent,
} from '@mui/icons-material';
import LearnerDistribution from './learner-distribution';

interface StatisticsProps {
    learnerProfiles: LearnerProfile[];
    sessions: Map<string, LearningSession[]>;
    statements: XAPIStatement[];
    verbs: Verb[];
    courseData: CourseData;
}

type TabValue = 'learners' | 'overview' | 'activities' | 'engagement';

interface StatCardProps {
    icon: SvgIconComponent;
    title: string;
    value: string | number;
    description: string;
}

interface UsageListProps {
    data: Record<string, number>;
    getLabel: (key: string) => string;
    getDescription?: (key: string) => string;
    maxItems?: number;
}

const XAPIStatistics = ({ learnerProfiles, sessions, statements, verbs, courseData }: StatisticsProps) => {
    const [activeTab, setActiveTab] = useState<TabValue>('learners');

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

        // Initialize activity and section usage with zeros for all possible items
        const activityUsage: Record<string, number> = {};
        const sectionUsage: Record<string, number> = {};

        // Initialize all sections and activities with 0 usage
        courseData.sections.forEach(section => {
            sectionUsage[section.title] = 0;
            section.activities.forEach(activity => {
                activityUsage[activity.id] = 0;
            });
        });

        // Add the actual usage counts from learners for activities
        activityUsageByLearner.forEach((activitySet) => {
            activitySet.forEach((activityId) => {
                if (activityId in activityUsage) {  // Check if it's a valid activity
                    activityUsage[activityId] += 1;
                }
            });
        });

        // Add the actual usage counts from learners for sections
        sectionUsageByLearner.forEach((sectionSet) => {
            sectionSet.forEach((sectionTitle) => {
                if (sectionTitle in sectionUsage) {  // Check if it's a valid section
                    sectionUsage[sectionTitle] += 1;
                }
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

    const StatCard = ({ icon: Icon, title, value, description }: StatCardProps) => (
        <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <Box display="flex" flexDirection="column">
                <Box display="flex" alignItems="center" mb={1}>
                    <Icon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h4" component="div" sx={{ mb: 0.5 }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </Box>
        </Paper>
    );

    const UsageList = ({ data, getLabel, getDescription}: UsageListProps) => (
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {Object.entries(data)
                .sort(([, a], [, b]) => b - a)
                .map(([key, count]) => (
                    <Box key={key} sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body1">{getLabel(key)}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {count} uses
                            </Typography>
                        </Box>
                        {getDescription && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {getDescription(key)}
                            </Typography>
                        )}
                        <LinearProgress
                            variant="determinate"
                            value={(count / Math.max(...Object.values(data))) * 100}
                            sx={{ height: 6, borderRadius: 1 }}
                        />
                    </Box>
                ))}
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

    const renderContent = () => {
        switch (activeTab) {
            case 'learners':
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={12}>
                            {learnerProfiles.length > 0 && (
                                <LearnerDistribution learnerProfiles={learnerProfiles} />
                            )}
                        </Grid>
                    </Grid>
                );
            case 'overview':
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <StatCard
                                icon={BarChartIcon}
                                title="Total Statements"
                                value={stats.totalStatements.toLocaleString()}
                                description="Total xAPI statements recorded"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatCard
                                icon={TimelineIcon}
                                title="Average Score"
                                value={`${stats.averageScore.toFixed(1)}%`}
                                description="Average score across all activities"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatCard
                                icon={SchoolIcon}
                                title="Average Activity Completion"
                                value={`${((stats.avgCompletedPerLearner / 15) * 100).toFixed(1)}%`}
                                description="Percentage of activities completed per learner"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatCard
                                icon={BookIcon}
                                title="Avg. Session Duration"
                                value={`${stats.avgSessionDuration.toFixed(1)}min`}
                                description="Average time per learning session"
                            />
                        </Grid>
                    </Grid>
                );
            case 'activities':
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Activitiy Usage
                                </Typography>
                                <UsageList
                                    data={stats.activityUsage}
                                    getLabel={(id) => getActivityDetails(id).name}
                                    getDescription={(id) => getActivityDetails(id).description}
                                    maxItems={undefined}
                                />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Section Usage
                                </Typography>
                                <UsageList
                                    data={stats.sectionUsage}
                                    getLabel={(title) => title}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                );
            case 'engagement':
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Learning Actions
                                </Typography>
                                <UsageList
                                    data={stats.verbUsage}
                                    getLabel={(id) => verbs.find(v => v.id === id)?.prefLabel || id}
                                    getDescription={(id) => verbs.find(v => v.id === id)?.definition || ''}
                                />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Learner Statistics
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <StatCard
                                        icon={BarChartIcon}
                                        title="Average Sessions per Learner"
                                        value={stats.avgSessionsPerLearner.toFixed(1)}
                                        description="Typical number of sessions per user"
                                    />
                                    <StatCard
                                        icon={TimelineIcon}
                                        title="Average Completed Activities"
                                        value={stats.avgCompletedPerLearner.toFixed(1)}
                                        description="Activities completed per learner"
                                    />
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                );
            default:
                return null;
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue: TabValue) => setActiveTab(newValue)}
                        aria-label="dashboard sections"
                    >
                        <Tab value="learners" label="Learner Distribution" />
                        <Tab value="overview" label="Overview" />
                        <Tab value="activities" label="Activities" />
                        <Tab value="engagement" label="Engagement" />
                    </Tabs>
                </Box>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default XAPIStatistics;