import React, { useMemo } from 'react';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';
import { Card, CardContent, Typography, Grid, Paper, LinearProgress } from '@mui/material';

interface Activity {
  id: string;
  title: string;
  estimatedDuration: number;
}

interface Section {
  title: string;
  activities: Activity[];
}

interface AverageTimePerModuleProps {
  learnerProfile: LearnerProfile;
  statements: XAPIStatement[];
  courseData: CourseData;
}

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

const AverageTimePerModule: React.FC<AverageTimePerModuleProps> = ({ learnerProfile, statements, courseData }) => {
  const sectionTimes: Record<string, { totalTime: number; activityCount: number }> = {}; // Time per Section and Activity Count

  // Calculate total time and count of activities per section for the given learner
  statements.forEach((statement) => {
    if (statement.actor.mbox === learnerProfile.email && statement.result?.duration) {
      const duration = parseDuration(statement.result.duration);

      const activityId = statement.object.definition.extensions?.[ 
        'https://w3id.org/learning-analytics/learning-management-system/external-id'
      ];
      if (!activityId) return;

      // Find the section for this activity
      for (const section of courseData.sections) {
        const activity = section.activities.find((a: Activity) => a.id === activityId); // Type activity
        if (activity) {
          if (!sectionTimes[section.title]) {
            sectionTimes[section.title] = { totalTime: 0, activityCount: 0 };
          }
          sectionTimes[section.title].totalTime += duration;
          sectionTimes[section.title].activityCount += 1;
        }
      }
    }
  });

  // Transform sectionTimes into a format that can be rendered in the UI, calculating the average time per section
  const sectionTimeData = useMemo(() => {
    return Object.entries(sectionTimes).map(([sectionTitle, { totalTime, activityCount }]) => ({
      section: sectionTitle,
      averageTime: activityCount > 0 ? totalTime / activityCount : 0, // Calculate the average time per activity
    }));
  }, [sectionTimes]);

  return (
    <Card>
      <CardContent>
        <Typography variant="body1" gutterBottom>
          Average Learning Time per Module
        </Typography>
        <Grid container spacing={3} direction="column">
          {sectionTimeData.map(({ section, averageTime }) => (
            <Grid item xs={12} key={section}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="body1">{section}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(averageTime)} minutes
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(averageTime / Math.max(...sectionTimeData.map((item) => item.averageTime))) * 100}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AverageTimePerModule;
