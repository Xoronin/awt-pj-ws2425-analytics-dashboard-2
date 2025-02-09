import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { XAPIStatement, CourseData } from '../types/types';

interface RatingsRecProps {
  statements: XAPIStatement[];
  courseData: CourseData;
}

// Utility function to parse duration in the format "PT20M37S" to minutes
const parseDuration = (duration: string): number => {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 15; // Default to 15 minutes if the duration is not available.

  const [, hours, minutes, seconds] = matches;
  return (
    (parseInt(hours || '0') * 60) +
    parseInt(minutes || '0') +
    Math.ceil(parseInt(seconds || '0') / 60)
  );
};

const RatingsRec: React.FC<RatingsRecProps> = ({ statements, courseData }) => {
  const ratedStatements = statements.filter(
    (statement) => statement.verb.id === 'http://id.tincanapi.com/verb/rated'
  );

  const activityRatings = useMemo(() => {
    const ratingsMap: Record<string, { totalScore: number; count: number }> = {};

    ratedStatements.forEach((statement) => {
      const activityId =
        statement.object.definition.extensions?.[ 
          'https://w3id.org/learning-analytics/learning-management-system/external-id'
        ];
      const score = statement.result?.score?.raw;

      if (activityId && score !== undefined) {
        if (!ratingsMap[activityId]) {
          ratingsMap[activityId] = { totalScore: 0, count: 0 };
        }
        ratingsMap[activityId].totalScore += score;
        ratingsMap[activityId].count += 1;
      }
    });

    return Object.keys(ratingsMap).map((activityId) => ({
      activityId,
      averageScore: ratingsMap[activityId].totalScore / ratingsMap[activityId].count,
    }));
  }, [ratedStatements]);

  const overallAverageScore =
    activityRatings.reduce((sum, activity) => sum + activity.averageScore, 0) /
    activityRatings.length;

  const lowRatedActivities = activityRatings.filter(
    (activity) => activity.averageScore < overallAverageScore * 1.0
  );

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

  // Helper function to fetch activity fields
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
      paddingLeft: 1,
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
      {lowRatedActivities.length > 0 ? (
        lowRatedActivities.map((activity, index) => {
          const difficulty = getActivityField(activity.activityId, 'difficulty');
          const typicalLearningTime = getActivityField(activity.activityId, 'typicalLearningTime');
          const title = getActivityField(activity.activityId, 'title');
          
          const parsedLearningTime = typicalLearningTime ? parseDuration(typicalLearningTime) : 15;

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
                  {title} {/* Display activity title */}
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
                  Rating: {(activity.averageScore).toFixed(1)}
                </Typography>
              </Box>

              {/* Display improvement message in red font if rating is lower than average */}
              {activity.averageScore < overallAverageScore && (
                <Typography
                  variant="body2"
                  sx={{
                    color: '#D32F2F',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    marginBottom: '8px',
                  }}
                >
                  🚨 This course needs attention/improvement! Its rating is lower than the average.
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
