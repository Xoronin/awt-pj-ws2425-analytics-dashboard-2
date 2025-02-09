import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { XAPIStatement, CourseData } from '../types/types';

interface LearningtimeRecProps {
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

const LearningtimeRec: React.FC<LearningtimeRecProps> = ({ statements, courseData }) => {
  const completedStatements = statements.filter(
    (statement) => statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed'
  );

  const activityCompletionTimes = useMemo(() => {
    const completionTimeMap: Record<string, { totalTime: number; count: number }> = {};

    completedStatements.forEach((statement) => {
      const activityId =
        statement.object.definition.extensions?.[
          'https://w3id.org/learning-analytics/learning-management-system/external-id'
        ];
      const duration = statement.result?.duration;

      if (activityId && duration) {
        const completionTime = parseDuration(duration);
        if (!completionTimeMap[activityId]) {
          completionTimeMap[activityId] = { totalTime: 0, count: 0 };
        }
        completionTimeMap[activityId].totalTime += completionTime;
        completionTimeMap[activityId].count += 1;
      }
    });

    return Object.keys(completionTimeMap).map((activityId) => ({
      activityId,
      averageTime: completionTimeMap[activityId].totalTime / completionTimeMap[activityId].count,
    }));
  }, [completedStatements]);

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
      '&::-webkit-scrollbar-track': {
        background: '#FFE0B2',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#FF9800',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#F57C00',
      },
    }}>
      {activityCompletionTimes.length > 0 ? (
        activityCompletionTimes.map((activity, index) => {
          const difficulty = getActivityField(activity.activityId, 'difficulty');
          const typicalLearningTime = getActivityField(activity.activityId, 'typicalLearningTime');
          const title = getActivityField(activity.activityId, 'title');
          
          const expectedTime = typicalLearningTime ? parseDuration(typicalLearningTime) : 15;
          const timeDifference = Math.abs(activity.averageTime - expectedTime) / expectedTime;

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
                    fontSize: '1.1rem',
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
                    bgcolor: timeDifference <= 0.2 ? '#F57C00' : '#D32F2F',
                    color: 'white',
                    borderRadius: 1,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  ⌀ {Math.round(activity.averageTime)}min
                </Typography>
              </Box>

              {timeDifference > 0.2 && (
                <Typography
                  variant="body2"
                  sx={{
                    color: '#D32F2F',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    marginBottom: '8px',
                  }}
                >
                  🚨 Verify typical Learning time! The average completion time differs significantly from the expected time of {expectedTime} minutes.
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
                    ⏱️ {expectedTime}min
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
          🎉 Great job! No activities have a significantly higher or lower average learning time than the typical learning time.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LearningtimeRec;