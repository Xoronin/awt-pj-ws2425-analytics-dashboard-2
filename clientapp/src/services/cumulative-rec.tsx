import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { XAPIStatement, LearnerProfile } from '../types/types';

interface CumulativeRecProps {
  statements: XAPIStatement[];
  learnerProfiles: LearnerProfile[];
}

const parseDuration = (duration: string): number => {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 15;
  const [, hours, minutes, seconds] = matches;
  return (
    (parseInt(hours || '0') * 60) +
    parseInt(minutes || '0') +
    Math.ceil(parseInt(seconds || '0') / 60)
  );
};

const CumulativeRec: React.FC<CumulativeRecProps> = ({ statements, learnerProfiles }) => {
  const studentTimes = useMemo(() => {
    // Calculate cumulative time for each student
    const cumulativeTime: Record<string, number> = {};

    const sortedStatements = [...statements].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedStatements.forEach((statement) => {
      const learnerEmail = statement.actor.mbox;
      const duration = statement.result?.duration ? parseDuration(statement.result.duration) : 0;
      cumulativeTime[learnerEmail] = (cumulativeTime[learnerEmail] || 0) + duration;
    });

    // Calculate average cumulative time
    const totalTime = Object.values(cumulativeTime).reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / Object.keys(cumulativeTime).length;

    // Find students with cumulative time significantly below average
    const belowAverageStudents = Object.entries(cumulativeTime)
      .filter(([, time]) => time < averageTime * 0.8)
      .map(([email, time]) => ({
        email,
        totalTime: time,
      }));

    return {
      students: belowAverageStudents,
      averageTime,
    };
  }, [statements]);

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
      {studentTimes.students.length > 0 ? (
        studentTimes.students.map((student, index) => (
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
                {student.email.replace('mailto:', '')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  px: 1.5,
                  py: 1.5,
                  bgcolor: student.totalTime >= studentTimes.averageTime * 0.9 
                    ? '#F57C00' 
                    : student.totalTime >= studentTimes.averageTime * 0.85 
                    ? '#D32F2F' 
                    : '#9F2F2F',
                  color: 'white',
                  borderRadius: 1,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                Total Time: {Math.round(student.totalTime)}mins
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: '#D32F2F',
                fontWeight: 600,
                fontSize: '0.85rem',
                marginBottom: '8px',
              }}
            >
              ⚠️ Low engagement detected! Student's total learning time is significantly below class average of {Math.round(studentTimes.averageTime)} minutes.
            </Typography>

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
          p: 2,
        }}>
          <Typography>
            👍 All students are showing good engagement levels based on learning time.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CumulativeRec;