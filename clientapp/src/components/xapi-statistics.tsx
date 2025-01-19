import React, { useState, useMemo } from 'react';
import { Verb, XAPIStatement, CourseData, LearnerProfile } from '../types/types';
import {
    Card,
    CardContent,
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

const XAPIStatistics = ({ learnerProfiles, statements, verbs, courseData }: StatisticsProps) => {
    const [activeTab, setActiveTab] = useState<TabValue>('learners');

    // Helper function to parse ISO 8601 duration
    const parseDuration = (duration: string): number => {
        // Parse ISO 8601 duration format (e.g., "PT1H30M" or "PT45M")
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 15; // default to 15 minutes

        const [, hours, minutes, seconds] = matches;
        return (
            (parseInt(hours || '0') * 60) +
            parseInt(minutes || '0') +
            Math.ceil(parseInt(seconds || '0') / 60)
        );
    };

    const stats = useMemo(() => {
        // Initialize tracking structures
        const activityUsage: Record<string, number> = {};
        const sectionUsage: Record<string, number> = {};
        const verbUsage: Record<string, number> = {};
        const completedActivities = new Map<string, Set<string>>();
        const learnerScores = new Map<string, number[]>(); 
        const learnerDurations = new Map<string, number>();

        // Initialize for all learners
        learnerProfiles.forEach(learner => {
            completedActivities.set(learner.email, new Set());
            learnerDurations.set(learner.email, 0);
        });

        // Initialize all sections and activities with 0 usage
        courseData.sections.forEach(section => {
            sectionUsage[section.title] = 0;
            section.activities.forEach(activity => {
                activityUsage[activity.id] = 0;
            });
        });

        // Process each statement
        statements.forEach(statement => {

            const learnerEmail = statement.actor.mbox;
            // Track verb usage
            const verbId = statement.verb.id;
            verbUsage[verbId] = (verbUsage[verbId] || 0) + 1;

            // Get activity ID
            const activityId = statement.object.definition.extensions?.[
                'https://w3id.org/learning-analytics/learning-management-system/external-id'
            ];
            if (!activityId) return;

            // Track activity usage
            activityUsage[activityId] = (activityUsage[activityId] || 0) + 1;

            // Find section for activity and track usage
            const section = courseData.sections.find(s =>
                s.activities.some(a => a.id === activityId)
            );
            if (section) {
                sectionUsage[section.title] = (sectionUsage[section.title] || 0) + 1;
            }

            // Check for completion either through verb or result field
            const isCompleted =
                (statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed') ||
                (statement.result?.completion === true);

            if (isCompleted) {
                completedActivities.get(learnerEmail)!.add(activityId);
            }


            // Track scores
            if (statement.result?.score?.raw !== undefined) {
                if (!learnerScores.has(activityId)) {
                    learnerScores.set(activityId, []);
                }
                learnerScores.get(activityId)!.push(statement.result.score.raw);
            }

            // Track durations
            if (statement.result?.duration) {
                const duration = parseDuration(statement.result.duration);
                const currentDuration = learnerDurations.get(learnerEmail) || 0;
                const newDuration = currentDuration + duration;
                learnerDurations.set(
                    learnerEmail,
                    newDuration
                );
            }
        });

        // Calculate averages and totals
        const totalActivities = courseData.sections.reduce(
            (acc, section) => acc + section.activities.length,
            0
        );

        const avgCompletedPerLearner = completedActivities.size > 0
            ? Array.from(completedActivities.values())
                .reduce((acc, set) => acc + set.size, 0) / completedActivities.size
            : 0;

        const averageScore =
            Array.from(learnerScores.values())
                .reduce((acc, scores) => acc + scores.reduce((a, b) => a + b, 0) / scores.length, 0) /
            Math.max(learnerScores.size, 1);

        const totalDuration = Array.from(learnerDurations.values())
            .reduce((acc, duration) => acc + duration, 0);
        const avgDuration = totalDuration / Math.max(learnerDurations.size, 1);

        return {
            activityUsage,
            sectionUsage,
            verbUsage,
            totalStatements: statements.length,
            uniqueLearners: learnerProfiles.length,
            statementsPerLearner: statements.length / learnerProfiles.length,
            averageScore,
            avgCompletedPerLearner,
            avgDuration,
            totalActivities
        };
    }, [statements, courseData, learnerProfiles]);


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

    const UsageList = ({ data, getLabel, getDescription }: UsageListProps) => (
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
                                value={`${((stats.avgCompletedPerLearner / stats.totalActivities) * 100).toFixed(1)}%`}
                                description="Percentage of activities completed per learner"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatCard
                                icon={BookIcon}
                                title="Avg. Learning Duration"
                                value={`${stats.avgDuration.toFixed(1)}min`}
                                description="Average time spent learning per learner"
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
                                    Activity Usage
                                </Typography>
                                <UsageList
                                    data={stats.activityUsage}
                                    getLabel={(id) => getActivityDetails(id).name}
                                    getDescription={(id) => getActivityDetails(id).description}
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
                                        title="Statements per Learner"
                                        value={stats.statementsPerLearner.toFixed(1)}
                                        description="Average statements generated per learner"
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