import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { XAPIStatement, CourseData } from '../types/types';
import { ParseDuration } from '../helper/helper';

interface RatingsRecProps {
    statements: XAPIStatement[];
    courseData: CourseData;
}

/**
 * Identifies and displays activities with poor user ratings,
 * providing recommendations for content creators to improve learning materials.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {CourseData} props.courseData - Structured course data containing sections and activities
 * 
 * @returns {React.ReactElement} A scrollable list of poorly-rated activities
 */
const RatingsRec: React.FC<RatingsRecProps> = ({ statements, courseData }) => {
    const ratedStatements = statements.filter(
        (statement) => statement.verb.id === 'http://id.tincanapi.com/verb/rated'
    );

    /**
     * Analyzes activity ratings to identify content that may need improvement.
     * Identifies activities with either low average ratings or a high number of very poor ratings.
     * 
     * @returns {Array} Array of activities needing improvement
     * @property {string} activityId - Unique identifier for the activity
     * @property {number} averageScore - Average rating score
     * @property {number} lowRatingsCount - Count of ratings that are 2 or lower
     * @property {string} improvementReason - Why the activity needs improvement ('low_average' or 'high_low_ratings')
     */
    const activityRatings = useMemo(() => {
        const ratingsMap: Record<string, {
            totalScore: number;
            count: number;
            lowRatingsCount: number; 
        }> = {};

        ratedStatements.forEach((statement) => {
            const activityId =
                statement.object.definition.extensions?.[
                'https://w3id.org/learning-analytics/learning-management-system/external-id'
                ];
            const score = statement.result?.score?.raw;

            if (activityId && score !== undefined) {
                if (!ratingsMap[activityId]) {
                    ratingsMap[activityId] = { totalScore: 0, count: 0, lowRatingsCount: 0 };
                }
                ratingsMap[activityId].totalScore += score;
                ratingsMap[activityId].count += 1;

                if (score <= 2) {
                    ratingsMap[activityId].lowRatingsCount += 1;
                }
            }
        });

        return Object.keys(ratingsMap).map((activityId) => ({
            activityId,
            averageScore: ratingsMap[activityId].totalScore / ratingsMap[activityId].count,
            lowRatingsCount: ratingsMap[activityId].lowRatingsCount
        }));
    }, [ratedStatements]);

    const overallAverageScore =
        activityRatings.reduce((sum, activity) => sum + activity.averageScore, 0) /
        activityRatings.length;

    /**
     * Identifies activities that need improvement based on two criteria:
     * 1. Low average score (below 70% of the overall average)
     * 2. High number of low ratings (more than 30 ratings of 2 or lower)
     * 
     * @returns {Array} Array of activities needing improvement, sorted by increasing average score
     * 
     */
    const improvementNeededActivities = useMemo(() => {
        const lowAverageActivities = activityRatings.filter(
            (activity) => activity.averageScore < overallAverageScore * 0.7
        );

        const highLowRatingsActivities = activityRatings.filter(
            (activity) => activity.lowRatingsCount > 30 
        );

        const combinedActivitiesMap = new Map();

        lowAverageActivities.forEach(activity => {
            combinedActivitiesMap.set(activity.activityId, {
                ...activity,
                improvementReason: 'low_average'
            });
        });

        highLowRatingsActivities.forEach(activity => {
            if (combinedActivitiesMap.has(activity.activityId)) {
            } else {
                combinedActivitiesMap.set(activity.activityId, {
                    ...activity,
                    improvementReason: 'high_low_ratings'
                });
            }
        });

        return Array.from(combinedActivitiesMap.values())
            .sort((a, b) => a.averageScore - b.averageScore);
    }, [activityRatings, overallAverageScore]);

    /**
     * Maps numeric difficulty values to human-readable strings.
     * 
     * @param {number} difficulty - Numeric difficulty value
     * @returns {string} Human-readable difficulty level
     */
    const mapActivityDifficultyToString = (difficulty: number): string => {
        switch (difficulty) {
            case 0.2: return 'very low';
            case 0.4: return 'low';
            case 0.6: return 'medium';
            case 0.8: return 'high';
            case 1.0: return 'very high';
            default: return 'unknown';
        }
    };

    /**
     * Retrieves a specific field value for an activity from the course data.
     * 
     * @param {string | undefined} activityId - The ID of the activity
     * @param {string} field - The name of the field to retrieve
     * @returns {any} The value of the requested field or null if not found
     */
    const getActivityField = (activityId: string | undefined, field: string) => {
        if (activityId && courseData.sections) {
            const section = courseData.sections.find((s) =>
                s.activities.some((a) => a.id === activityId)
            );

            if (section) {
                const activity = section.activities.find((a) => a.id === activityId);
                const value = (activity as any)?.[field];

                return value || null;
            }
        }
        return null;
    };

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
                height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
                background: '#FF9800',
                borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
                background: '#F57C00',
            },
        }}>
            {improvementNeededActivities.length > 0 ? (
                improvementNeededActivities.map((activity, index) => {
                    const difficulty = getActivityField(activity.activityId, 'difficulty');
                    const typicalLearningTime = getActivityField(activity.activityId, 'typicalLearningTime');
                    const title = getActivityField(activity.activityId, 'title');

                    const parsedLearningTime = typicalLearningTime ? ParseDuration(typicalLearningTime) : 15;

                    return (
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
                                    bgcolor: '#FFE0B2',
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
                                        color: '#E65100',
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {title}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        px: 1.5,
                                        py: 1.5,
                                        bgcolor: activity.averageScore >= 5 ? '#F57C00' : activity.averageScore >= 4 ? '#D32F2F' : '#9F2F2F',
                                        color: 'white',
                                        borderRadius: 1,
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        lineHeight: 1,
                                    }}
                                >
                                    Average Rating: {(activity.averageScore).toFixed(1)}
                                </Typography>
                            </Box>

                            {/* Display appropriate improvement message based on the reason */}
                            {activity.improvementReason === 'low_average' && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#D32F2F',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        marginBottom: '8px',
                                    }}
                                >
                                    🚨 This activity's content may need improvement! Its rating is significantly lower than the average.
                                </Typography>
                            )}

                            {activity.improvementReason === 'high_low_ratings' && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#D32F2F',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        marginBottom: '8px',
                                    }}
                                >
                                    🚨 This activity's content may need improvement! It has a large amount of very poor ratings.
                                </Typography>
                            )}

                            <Box sx={{
                                display: 'flex',
                                gap: 1,
                                mt: 'auto',
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
                                    borderColor: '#FFB74D',
                                }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        ⚡ {mapActivityDifficultyToString(difficulty)}
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
                                    borderColor: '#FFB74D',
                                }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        ⏱️ {parsedLearningTime}min
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    );
                })
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
                        🎉 Great job! No activities have a significantly lower rating than average.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default RatingsRec;
