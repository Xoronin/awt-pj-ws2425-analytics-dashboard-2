import React, { useState, useEffect } from 'react';
import type { LearnerProfile, XAPIStatement, CourseData, Activity } from '../types/types';
import { Typography, Box } from '@mui/material';

interface RecommendationServiceProps {
    learnerProfile: LearnerProfile;
    statements: XAPIStatement[];
    courseData: CourseData;
}

type ActivityHistory = {
    completions: number;
    scores: number[];
    avgTime: number;
    attempts: number;
};

type PersonaWeights = {
    [key in 'struggler' | 'average' | 'sprinter' | 'gritty' | 'coaster']: number;
};

type RecommendedActivity = Activity & {
    score: number;
    isReview?: boolean;
};

const RecommendationService: React.FC<RecommendationServiceProps> = ({
    learnerProfile,
    statements,
    courseData
}) => {
    const [recommendations, setRecommendations] = useState<RecommendedActivity[]>([]);

    const getActivityId = (statement: XAPIStatement): string => {
        // Try to get ID from extensions first
        const extensionId = statement.object.definition.extensions?.[
            'https://w3id.org/learning-analytics/learning-management-system/external-id'
        ];
        if (extensionId) return extensionId;

        // Fallback to object ID
        return statement.object.id;
    };

    const analyzeStatements = (statements: XAPIStatement[], learnerEmail: string): Record<string, ActivityHistory> => {
        return statements
            .filter(s => s.actor.mbox === learnerEmail)
            .reduce((acc, statement) => {
                const activityId = getActivityId(statement);
                if (!acc[activityId]) {
                    acc[activityId] = { completions: 0, scores: [], avgTime: 0, attempts: 0 };
                }

                if (statement.result?.completion) acc[activityId].completions++;
                if (statement.result?.score?.scaled) {
                    acc[activityId].scores.push(statement.result.score.scaled);
                }
                if (statement.result?.duration) {
                    acc[activityId].avgTime = parseDuration(statement.result.duration);
                }
                acc[activityId].attempts++;
                return acc;
            }, {} as Record<string, ActivityHistory>);
    };

    const parseDuration = (duration: string): number => {
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 0;
        const [, hours, minutes, seconds] = matches.map(Number);
        return (hours || 0) * 60 + (minutes || 0) + (seconds || 0) / 60;
    };

    const getMetricValue = (metric: number | { start: number; middle: number; end: number }): number => {
        if (typeof metric === 'number') return metric;
        return (metric.start + metric.middle + metric.end) / 3;
    };

    const calculateActivityScore = (
        activity: Activity,
        learner: LearnerProfile,
        history: Record<string, ActivityHistory>
    ): number => {
        const metrics = {
            consistency: getMetricValue(learner.metrics.consistency),
            effort: getMetricValue(learner.metrics.effort),
            scores: getMetricValue(learner.metrics.scores),
            duration: getMetricValue(learner.metrics.duration)
        };

        // Base scores (0-1 range)
        const baseScores = {
            // Match difficulty to learner performance
            performanceMatch: 1 - Math.abs(metrics.scores / 100 - activity.difficulty),

            // Match effort level to interactivity
            effortMatch: 1 - Math.abs(metrics.effort / 100 -
                (activity.interactivityLevel === 'high' ? 0.8 :
                    activity.interactivityLevel === 'medium' ? 0.5 : 0.3)
            ),

            // Match estimated duration to learner's typical duration
            timeMatch: 1 - Math.min(1, Math.abs(activity.estimatedDuration - metrics.duration) / 60)
        };

        // Apply persona-specific weightings
        let finalScore = 0;
        switch (learner.personaType) {
            case 'struggler':
                finalScore = (
                    baseScores.performanceMatch * 0.5 +
                    baseScores.effortMatch * 0.3 +
                    baseScores.timeMatch * 0.2
                );
                break;
            case 'sprinter':
                finalScore = (
                    baseScores.performanceMatch * 0.3 +
                    baseScores.effortMatch * 0.2 +
                    baseScores.timeMatch * 0.5
                );
                break;
            case 'gritty':
                finalScore = (
                    baseScores.performanceMatch * 0.4 +
                    baseScores.effortMatch * 0.4 +
                    baseScores.timeMatch * 0.2
                );
                break;
            case 'coaster':
                finalScore = (
                    baseScores.performanceMatch * 0.2 +
                    baseScores.effortMatch * 0.5 +
                    baseScores.timeMatch * 0.3
                );
                break;
            default: // average
                finalScore = (
                    baseScores.performanceMatch * 0.33 +
                    baseScores.effortMatch * 0.33 +
                    baseScores.timeMatch * 0.34
                );
        }

        // Apply difficulty adjustment based on persona
        const difficultyAdjustment = getPersonaWeight(learner.personaType, activity.difficulty);
        finalScore = finalScore * difficultyAdjustment;

        // Ensure score is between 0 and 1
        return Math.max(0, Math.min(1, finalScore));
    };

    const getPersonaWeight = (persona: string, difficulty: number): number => {
        const weights: PersonaWeights = {
            'struggler': 1 - difficulty,
            'average': 1 - Math.abs(0.5 - difficulty),
            'sprinter': difficulty < 0.7 ? 1 : 0.5,
            'gritty': 1,
            'coaster': difficulty < 0.3 ? 1 : 0.3
        };
        return weights[persona as keyof PersonaWeights] || 0.5;
    };

    const generateRecommendations = (): RecommendedActivity[] => {
        if (!courseData) return [];

        const history = analyzeStatements(statements, learnerProfile.email);
        const allActivities = courseData.sections.flatMap(s => s.activities);

        const completedActivityIds = new Set(
            statements
                .filter(s =>
                    s.actor.mbox === learnerProfile.email &&
                    s.result?.completion === true
                )
                .map(s => s.object.definition.extensions?.[
                    'https://w3id.org/learning-analytics/learning-management-system/external-id'])
        );

        const availableActivities = allActivities.filter(activity =>
            !completedActivityIds.has(activity.id)
        );

        if (availableActivities.length === 0) {
            return allActivities
                .filter(activity => activity.difficulty > 0.7)
                .map(activity => ({
                    ...activity,
                    score: calculateActivityScore(activity, learnerProfile, history),
                    isReview: true
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);
        }
        return availableActivities
            .map(activity => ({
                ...activity,
                score: calculateActivityScore(activity, learnerProfile, history),
                prerequisitesCompleted: !activity.id.includes('advanced') ||
                    completedActivityIds.has(activity.id.replace('advanced', 'basic'))
            }))
            .filter(activity => activity.prerequisitesCompleted)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    };


    const mapActivityDifficultyToString = (difficulty: number): string => {
        switch (difficulty) {
            case 0.2:
                return 'very low';
            case 0.4:
                return 'low';
            case 0.6:
                return 'medium';
            case 0.8:
                return 'high';
            case 1.0:
                return 'very high';
            default:
                return '';
        }
    }

    useEffect(() => {
        const newRecommendations = generateRecommendations();
        setRecommendations(newRecommendations);
    }, [learnerProfile.email, statements.length]); 

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            overflowY: 'auto',
            paddingRight: 1,
            maxHeight: '100%',
            pb: 2
        }}>
            {recommendations.slice(0, 4).map((rec, index) => (
                <Box
                    key={index}
                    sx={{
                        p: 1,
                        bgcolor: rec.isReview ? 'info.lighter' : 'primary.lighter',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: rec.isReview ? 'info.light' : 'primary.light',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: '0 0 auto',
                        minHeight: '30px',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 2,
                            cursor: 'pointer'
                        },
                        '&:last-child': {
                            mb: 2
                        },
                        '&:first-child': {
                            mt: 1
                        }
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1
                    }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '70%'
                            }}
                        >
                            {rec.title}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                px: 1,
                                py: 0.5,
                                bgcolor: rec.score >= 0.8 ? 'success.main' :
                                    rec.score >= 0.6 ? 'primary.main' : 'warning.main',
                                color: 'white',
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 500
                            }}
                        >
                            {(rec.score * 100).toFixed(0)}% Match
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        gap: 1,
                        mt: 'auto'
                    }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: 'background.paper',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                ⚡ {mapActivityDifficultyToString(rec.difficulty)}
                            </Typography>
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: 'background.paper',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                ⏱️ {rec.estimatedDuration}min
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default RecommendationService;