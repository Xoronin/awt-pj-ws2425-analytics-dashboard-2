import React, { useState, useEffect } from 'react';
import type { LearnerProfile, XAPIStatement, CourseData, Activity } from '../types/types';
import { Typography, Box } from '@mui/material';
import { ParseDuration } from '../helper/helper';

interface RecommendationServiceProps {
    learnerProfile: LearnerProfile;
    statements: XAPIStatement[];
    courseData: CourseData;
}

/**
 * Interface for tracking a learner's history with an activity
 * @interface ActivityHistory
 * @property {number} completions - Number of times the activity was completed
 * @property {number[]} scores - Array of scores achieved on this activity
 * @property {number} avgTime - Average time spent on the activity in minutes
 * @property {number} attempts - Total number of attempts on the activity
 */
type ActivityHistory = {
    completions: number;
    scores: number[];
    avgTime: number;
    attempts: number;
};

/**
 * Interface for a recommended activity with score
 * @interface RecommendedActivity
 * @extends Activity
 * @property {number} score - Recommendation score (0-1) indicating match quality
 */
type RecommendedActivity = Activity & {
    score: number;
};

/** 
 * Provides personalized activity recommendations for learners based on their
 * learning history, performance, and persona type.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {LearnerProfile} props.learnerProfile - The learner's profile data
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {CourseData} props.courseData - Structured course data containing sections and activities
 * 
 * @returns {React.ReactElement} A scrollable list of recommended activities
 */
const RecommendationService: React.FC<RecommendationServiceProps> = ({
    learnerProfile,
    statements,
    courseData
}) => {
    const [recommendations, setRecommendations] = useState<RecommendedActivity[]>([]);

    /**
     * Extracts the activity ID from an xAPI statement.
     * Prioritizes the external-id extension if available, otherwise uses the object ID.
     * 
     * @param {XAPIStatement} statement - xAPI statement to extract ID from
     * @returns {string} Activity ID
     */
    const getActivityId = (statement: XAPIStatement): string => {
        const extensionId = statement.object.definition.extensions?.[
            'https://w3id.org/learning-analytics/learning-management-system/external-id'
        ];
        if (extensionId) return extensionId;

        return statement.object.id;
    };

    /**
     * Analyzes statements to build a history of learner's interactions with activities.
     * 
     * @param {XAPIStatement[]} statements - Array of xAPI statements
     * @param {string} learnerEmail - Email of the learner to analyze
     * @returns {Record<string, ActivityHistory>} Map of activity IDs to their history data
     */
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
                    acc[activityId].avgTime = ParseDuration(statement.result.duration);
                }
                acc[activityId].attempts++;
                return acc;
            }, {} as Record<string, ActivityHistory>);
    };

    /**
     * Calculates a matching score between a learner and an activity.
     * Considers the learner's persona type to weight difficulty and duration factors differently.
     * 
     * @param {Activity} activity - The activity to score
     * @param {LearnerProfile} learner - The learner's profile
     * @param {Record<string, ActivityHistory>} history - The learner's activity history
     * @returns {number} Score between 0-1 indicating how well the activity matches the learner
     */
    const calculateActivityScore = (
        activity: Activity,
        learner: LearnerProfile,
        history: Record<string, ActivityHistory>
    ): number => {
        const avgScore = Object.values(history).reduce((sum, h) =>
            sum + (h.scores.length ? h.scores.reduce((a, b) => a + b, 0) / h.scores.length : 0), 0)
            / Math.max(Object.keys(history).length, 1);

        const avgDuration = Object.values(history).reduce((sum, h) => sum + h.avgTime, 0)
            / Math.max(Object.keys(history).length, 1);

        const targetDifficulty = Math.min(avgScore + 0.2, 1);
        const difficultyMatch = 1 - Math.abs(targetDifficulty - activity.difficulty);

        const durationMatch = 1 - Math.min(1, Math.abs(activity.estimatedDuration - avgDuration) / 60);


        switch (learner.personaType) {
            case 'struggler':
                return difficultyMatch * 0.7 + durationMatch * 0.3;
            case 'sprinter':
                return difficultyMatch * 0.4 + durationMatch * 0.6;
            case 'gritty':
                return difficultyMatch * 0.8 + durationMatch * 0.2;
            case 'coaster':
                return difficultyMatch * 0.5 + durationMatch * 0.5;
            default: 
                return difficultyMatch * 0.6 + durationMatch * 0.4;
        }
    };

    /**
     * Generates personalized activity recommendations based on learner's history.
     * Filters completed activities, checks prerequisites, and sorts by matching score.
     * 
     * @returns {RecommendedActivity[]} Array of recommended activities sorted by score
     */
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

        if (completedActivityIds.size >= allActivities.length) {
            return [];
        }

        const availableActivities = allActivities.filter(activity =>
            !completedActivityIds.has(activity.id)
        );

        if (availableActivities.length === 0) {
            return allActivities
                .filter(activity => activity.difficulty > 0.7)
                .map(activity => ({
                    ...activity,
                    score: calculateActivityScore(activity, learnerProfile, history)
                }))
                .sort((a, b) => b.score - a.score)
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
    };

    /**
     * Maps numeric difficulty values to human-readable strings.
     * 
     * @param {number} difficulty - Numeric difficulty value
     * @returns {string} Human-readable difficulty level
     */
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
            height: 'calc(100% - 56px)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            gap: 1,
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
            '&::-webkit-scrollbar-thumb': {
                background: '#FF9800',
                borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
                background: '#F57C00'
            }
        }}>
            {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                    <Box
                        key={index}
                        sx={{
                            p: 1,
                            bgcolor: '#FFF3E0', 
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: '#FFB74D', 
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                            display: 'flex',
                            flexDirection: 'column',
                            flex: '0 0 auto',
                            minHeight: '30px',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 2,
                                cursor: 'pointer',
                                bgcolor: '#FFE0B2' 
                            }
                        }}
                    >
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1
                    }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: '#E65100',
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {rec.title}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                px: 1.5,
                                py: 1.5,
                                bgcolor: rec.score >= 0.7 ? '#2E7D32' :  
                                    rec.score >= 0.6 ? '#F57C00' :      
                                        '#D32F2F',                          
                                color: 'white',
                                borderRadius: 1,
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                lineHeight: 1
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
                            bgcolor: '#FFF8E1',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: '#FFB74D'
                        }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                ⚡ {mapActivityDifficultyToString(rec.difficulty)}
                            </Typography>
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: '#FFF8E1',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: '#FFB74D'
                        }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                ⏱️ {rec.estimatedDuration}min
                            </Typography>
                        </Box>
                    </Box>
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
                    p: 2
                }}>
                    <Typography>
                        🎉 Great job! You've completed all available activities.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default RecommendationService;