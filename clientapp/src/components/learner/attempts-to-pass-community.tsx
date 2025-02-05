import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';

interface LearningAttemptsCommunity {
  statements: XAPIStatement[];
  learners: LearnerProfile[]; // Alle Lernenden
  courseData: CourseData;
}

const LearningAttemptsCommunity: React.FC<LearningAttemptsCommunity> = ({ statements, learners, courseData }) => {
  const theme = useTheme();

  const COLORS = [theme.palette.grey[300], theme.palette.success.main];

  const attemptsData = useMemo(() => {
    const attemptsMap: Record<string, { failed: number; passed: number }> = {};

    // Sammeln der Versuche für alle Lernenden
    learners.forEach(learner => {
      statements.forEach(statement => {
        if (statement.actor.mbox === learner.email) {
          if (statement.verb.id === "http://adlnet.gov/expapi/verbs/passed") {
            const activityId = statement.object.id;
            if (!attemptsMap[activityId]) {
              attemptsMap[activityId] = { failed: 0, passed: 0 };
            }
            attemptsMap[activityId].passed += 1;
          } else if (statement.verb.id === "http://adlnet.gov/expapi/verbs/failed") {
            const activityId = statement.object.id;
            if (!attemptsMap[activityId]) {
              attemptsMap[activityId] = { failed: 0, passed: 0 };
            }
            attemptsMap[activityId].failed += 1;
          }
        }
      });
    });

    // Berechne die mittlere Anzahl der Versuche für alle Lernenden
    const totalAttempts = Object.values(attemptsMap).reduce(
      (acc, { failed, passed }) => {
        acc.failed += failed;
        acc.passed += passed;
        return acc;
      },
      { failed: 0, passed: 0 }
    );

    const totalActivities = Object.keys(attemptsMap).length;
    const averageAttempts = (totalAttempts.failed + totalAttempts.passed) / totalActivities;

    return {
      failed: totalAttempts.failed,
      passed: totalAttempts.passed,
      totalAttempts: totalAttempts.failed + totalAttempts.passed, // Gesamtzahl der Versuche
      averageAttempts
    };
  }, [statements, learners]);

  // Berechne den Anteil der bestandenen Versuche
  const passPercentage = (attemptsData.passed / attemptsData.totalAttempts) * 100;

  const chartData = [
    { name: 'Failed Attempts', value: attemptsData.failed },
    { name: 'Passed Attempts', value: attemptsData.passed }
  ];

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <Typography variant="body1" sx={{ marginBottom: '2px' }}>
        Community's Attempts to Pass
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie 
            data={chartData} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            innerRadius={40} 
            outerRadius={60} 
            fill={theme.palette.primary.main}
            labelLine={false}
          >
            <Label value={`${passPercentage.toFixed(2)}%`} position="center" />
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};


export default LearningAttemptsCommunity;
