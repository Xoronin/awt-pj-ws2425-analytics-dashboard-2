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

interface AverageScorePerModuleProps {
  learnerProfile: LearnerProfile;
  statements: XAPIStatement[];
  courseData: CourseData;
}

const parseScore = (score: any): number => {
  // Falls kein Score vorhanden ist, default auf 0
  return score?.raw ?? 0;
};

const AverageScorePerModule: React.FC<AverageScorePerModuleProps> = ({ learnerProfile, statements, courseData }) => {
  // Wir speichern den letzten Score pro Aktivität
  const sectionScores: Record<string, { totalScore: number; activityCount: number; seenActivities: Set<string> }> = {}; // Score pro Section, Aktivitätsanzahl und bereits betrachtete Aktivitäten

  // Berechne den totalen Score und die Aktivitätsanzahl pro Modul für den Lernenden
  statements.forEach((statement) => {
    if (statement.actor.mbox === learnerProfile.email && statement.result?.score) {
      const score = parseScore(statement.result.score); // Hole den Score der Aktivität

      const activityId = statement.object.definition.extensions?.[ 
        'https://w3id.org/learning-analytics/learning-management-system/external-id'
      ];
      if (!activityId) return;

      // Finde das Modul, zu dem diese Aktivität gehört
      for (const section of courseData.sections) {
        const activity = section.activities.find((a: Activity) => a.id === activityId); // Type activity
        if (activity) {
          if (!sectionScores[section.title]) {
            sectionScores[section.title] = { totalScore: 0, activityCount: 0, seenActivities: new Set() };
          }

          // Wir fügen den Score nur einmal pro Aktivität hinzu (den letzten Score)
          if (!sectionScores[section.title].seenActivities.has(activityId)) {
            sectionScores[section.title].totalScore += score;
            sectionScores[section.title].activityCount += 1;
            sectionScores[section.title].seenActivities.add(activityId); // Markiere die Aktivität als gesehen
          }
        }
      }
    }
  });

  // Berechne den Durchschnitt der Scores pro Modul
  const sectionScoreData = useMemo(() => {
    return Object.entries(sectionScores).map(([sectionTitle, { totalScore, activityCount }]) => ({
      section: sectionTitle,
      averageScore: activityCount > 0 ? totalScore / activityCount : 0, // Durchschnitts-Score pro Modul
    }));
  }, [sectionScores]);

  return (
    <Card>
      <CardContent>
        <Typography variant="body1" gutterBottom>
          Average Score per Module
        </Typography>
        <Grid container spacing={3} direction="column">
          {sectionScoreData.map(({ section, averageScore }) => (
            <Grid item xs={12} key={section}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="body1">{section}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(averageScore )}% {/* Zeige den Durchschnitt in Prozent an */}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={averageScore} // Der Fortschrittsbalken wird basierend auf dem Durchschnitts-Score angezeigt
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

export default AverageScorePerModule;
