import React, { useMemo } from 'react';
import { Grid, Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, CourseData } from '../../types/types';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';

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

interface CourseTimeProps {
  statements: XAPIStatement[];
  courseData: CourseData;
}

const CourseTime: React.FC<CourseTimeProps> = ({ statements, courseData }) => {
  const theme = useTheme();

    // Extract the activityId from the first statement
    const activityId = statements[0]?.object.definition.extensions?.[
        'https://w3id.org/learning-analytics/learning-management-system/external-id'
      ];
    
      // Find the corresponding typicalLearningTime from courseData
    const activityTypicalTime = useMemo(() => {
      if (activityId && courseData.sections) {
        // Find the activity within the courseData.sections based on the activityId
        const section = courseData.sections.find((s) =>
          s.activities.some((a) => a.id === activityId)
        );
        
        // If the section and activity are found, get the typicalLearningTime
        if (section) {
          const activity = section.activities.find((a) => a.id === activityId);
          return activity?.typicalLearningTime || null; // Return null if not found
        }
      }
      return null; // Return null if no matching activityId is found
      }, [activityId, courseData]);
    
      // Log the typicalLearningTime to the console
      console.log('Typical Learning Time:', activityTypicalTime);

  // Process the data to extract the learning times for each student
  const learningTimes = useMemo(() => {
    const timePerStudent: { [email: string]: number } = {}; // Keyed by learner email, value is total duration

    // Process each statement for the completion event
    statements.forEach((statement) => {
      if (
        statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed' && // Ensure the statement is a 'completed' statement
        statement.result?.duration
      ) {
        const duration = parseDuration(statement.result.duration);

        // Use statement.actor.mbox as the learner identifier (email)
        const learnerEmail = statement.actor.mbox;

        if (!timePerStudent[learnerEmail]) {
          timePerStudent[learnerEmail] = 0;
        }

        timePerStudent[learnerEmail] += duration; // Add the parsed duration for this learner
      }
    });

    // Now we have total learning time for each student
    return Object.entries(timePerStudent).map(([email, totalTime]) => ({
      email,
      totalTime,
    }));
  }, [statements]);

  // Dynamically calculate the bucket ranges based on the min and max learning times
  const histogramData = useMemo(() => {
    if (learningTimes.length === 0) return []; // No data available

    const minTime = Math.min(...learningTimes.map(entry => entry.totalTime));
    const maxTime = Math.max(...learningTimes.map(entry => entry.totalTime));

    // Define number of buckets based on the range between min and max (e.g., 10 buckets)
    const bucketCount = 10;
    const bucketSize = Math.ceil((maxTime - minTime) / bucketCount);

    // Create the bucket ranges dynamically
    const timeRanges = Array.from({ length: bucketCount }, (_, index) => {
      const start = minTime + index * bucketSize;
      const end = Math.min(start + bucketSize - 1, maxTime); // Ensure last bucket is within range
      return {
        name: `${start}-${end} minutes`,
        count: 0,
      };
    });

    // Group students into the dynamic buckets
    learningTimes.forEach((entry) => {
      const totalTime = entry.totalTime;

      // Find the correct bucket for each student's total learning time
      timeRanges.forEach((bucket) => {
        const [start, end] = bucket.name.split('-').map(n => parseInt(n));
        if (totalTime >= start && totalTime <= end) {
          bucket.count++;
        }
      });
    });

    return timeRanges;
  }, [learningTimes]);

  return (
    <Grid item xs={12} md={6} sx={{ height: '100%' }}>
      {histogramData.length > 0 && (
        <Box sx={{ width: '100%', height: '100%' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Learning Time Distribution (in minutes)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={histogramData}>
              <XAxis dataKey="name" label={{ value: 'Learning Time Range', position: 'insideBottom', offset: 0 }} />
              <YAxis label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Grid>
  );
};

export default CourseTime;
