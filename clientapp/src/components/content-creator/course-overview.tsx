import React, { useMemo, useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
} from '@mui/material';
import { XAPIStatement, CourseData } from '../../types/types';

interface CourseOverviewProps {
  statements: XAPIStatement[];
  courseData: CourseData;
}

const parseDuration = (duration: string): number => {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 15; // Default to 15 minutes if the duration is not available or malformed.

  const [, hours, minutes, seconds] = matches;
  return (
    (parseInt(hours || '0') * 60) + parseInt(minutes || '0') + Math.ceil(parseInt(seconds || '0') / 60)
  );
};

const CourseOverview: React.FC<CourseOverviewProps> = ({ statements, courseData }) => {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string>('averageLearningTime');

  const uniqueActivityIds = useMemo(() => {
    const activityIds = new Set<string>();

    statements.forEach((statement) => {
      const activityId = statement.object.definition.extensions?.[ 
        'https://w3id.org/learning-analytics/learning-management-system/external-id'
      ];
      if (activityId) {
        activityIds.add(activityId);
      }
    });

    return Array.from(activityIds);
  }, [statements]);

  const getActivityField = (activityId: string | undefined, field: string) => {
    if (activityId && courseData.sections) {
      const section = courseData.sections.find((s) =>
        s.activities.some((a) => a.id === activityId)
      );

      if (section) {
        const activity = section.activities.find((a) => a.id === activityId);
        return (activity as any)?.[field] || null;
      }
    }
    return null;
  };

  const calculateAverageLearningTime = (activityId: string): string => {
    const relevantStatements = statements.filter(
      (statement) =>
        statement.object.definition.extensions?.[
          'https://w3id.org/learning-analytics/learning-management-system/external-id'
        ] === activityId &&
        statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed' &&
        statement.result?.duration
    );

    if (relevantStatements.length === 0) return 'N/A'; // Return 'N/A' if there are no completed statements with duration.

    const totalDuration = relevantStatements.reduce((sum, statement) => {
      const duration = statement.result?.duration;
      return sum + (duration ? parseDuration(duration) : 0);
    }, 0);

    const averageDuration = Math.round(totalDuration / relevantStatements.length);
    return `${averageDuration} min`; // Return the average duration in minutes.
  };

  const calculateAverageGrade = (activityId: string): string => {
    const scoredStatements = statements.filter(
      (statement) =>
        statement.object.definition.extensions?.[
          'https://w3id.org/learning-analytics/learning-management-system/external-id'
        ] === activityId &&
        statement.verb.id === 'http://adlnet.gov/expapi/verbs/scored' &&
        statement.result?.score?.raw !== undefined &&
        statement.actor?.mbox
    );

    if (scoredStatements.length === 0) return 'N/A'; // Return 'N/A' if no scored statements are found.

    const studentScores: { [email: string]: number[] } = {};

    scoredStatements.forEach((statement) => {
      const email = statement.actor.mbox!;
      const score = statement.result!.score!.raw!;
      if (!studentScores[email]) {
        studentScores[email] = [];
      }
      studentScores[email].push(score);
    });

    // Calculate average for each student
    const studentAverages = Object.values(studentScores).map((scores) => {
      const total = scores.reduce((sum, score) => sum + score, 0);
      return total / scores.length;
    });

    // Calculate overall average
    const overallAverage = studentAverages.reduce((sum, avg) => sum + avg, 0) / studentAverages.length;
    return overallAverage.toFixed(2); // Return the average grade rounded to 2 decimal places.
  };

  const calculateAverageAttemptsToPass = (activityId: string): string => {
    const relevantStatements = statements.filter(
      (statement) =>
        statement.object.definition.extensions?.[
          'https://w3id.org/learning-analytics/learning-management-system/external-id'
        ] === activityId &&
        (statement.verb.id === 'http://adlnet.gov/expapi/verbs/passed' ||
          statement.verb.id === 'http://adlnet.gov/expapi/verbs/failed') &&
        statement.actor?.mbox
    );

    if (relevantStatements.length === 0) return 'N/A'; // Return 'N/A' if no statements are found.

    const studentAttempts: { [email: string]: number } = {};

    relevantStatements.forEach((statement) => {
      const email = statement.actor.mbox!;
      if (!studentAttempts[email]) {
        studentAttempts[email] = 0;
      }
      studentAttempts[email] += 1;
    });

    // Calculate the average attempts to pass for each student
    const studentAttemptsArray = Object.values(studentAttempts);
    const overallAverageAttempts = studentAttemptsArray.reduce((sum, attempts) => sum + attempts, 0) / studentAttemptsArray.length;

    return overallAverageAttempts.toFixed(2); // Return the average attempts rounded to 2 decimal places.
  };

  const calculateAverageRating = (activityId: string): string => {
    const ratedStatements = statements.filter(
      (statement) =>
        statement.object.definition.extensions?.[
          'https://w3id.org/learning-analytics/learning-management-system/external-id'
        ] === activityId &&
        statement.verb.id === 'http://id.tincanapi.com/verb/rated' &&
        statement.result?.score?.raw !== undefined
    );

    if (ratedStatements.length === 0) return 'N/A'; // Return 'N/A' if no rated statements are found.

    const totalRating = ratedStatements.reduce((sum, statement) => {
      const score = statement.result!.score!.raw!;
      return sum + score;
    }, 0);

    const averageRating = totalRating / ratedStatements.length;
    return averageRating.toFixed(2); // Return the average rating rounded to 2 decimal places.
  };

  const rows = useMemo(() => {
    return uniqueActivityIds.map((activityId) => ({
      activityId,
      title: getActivityField(activityId, 'title'),
      resourceType: getActivityField(activityId, 'learningResourceType'),
      interactivityType: getActivityField(activityId, 'interactivityType'),
      interactivityLevel: getActivityField(activityId, 'interactivityLevel'),
      semanticDensity: getActivityField(activityId, 'semanticDensity'),
      difficulty: getActivityField(activityId, 'difficulty'),
      typicalLearningTime: parseDuration(getActivityField(activityId, 'typicalLearningTime')),
      averageLearningTime: calculateAverageLearningTime(activityId),
      averageGrade: calculateAverageGrade(activityId),
      averageAttemptsToPass: calculateAverageAttemptsToPass(activityId),
      averageRating: calculateAverageRating(activityId),
    }));
  }, [uniqueActivityIds, courseData, statements]);

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortRows = (rows: any[]) => {
    const comparator = (a: any, b: any) => {
      if (orderBy === 'averageLearningTime') {
        return order === 'desc'
          ? parseInt(b.averageLearningTime) - parseInt(a.averageLearningTime)
          : parseInt(a.averageLearningTime) - parseInt(b.averageLearningTime);
      } else if (orderBy === 'averageGrade') {
        return order === 'desc'
          ? parseFloat(b.averageGrade) - parseFloat(a.averageGrade)
          : parseFloat(a.averageGrade) - parseFloat(b.averageGrade);
      } else if (orderBy === 'averageAttemptsToPass') {
        return order === 'desc'
          ? parseFloat(b.averageAttemptsToPass) - parseFloat(a.averageAttemptsToPass)
          : parseFloat(a.averageAttemptsToPass) - parseFloat(b.averageAttemptsToPass);
      } else if (orderBy === 'averageRating') {
        return order === 'desc'
          ? parseFloat(b.averageRating) - parseFloat(a.averageRating)
          : parseFloat(a.averageRating) - parseFloat(b.averageRating);
      }
      return 0;
    };

    return rows.sort(comparator);
  };

  return (
    <Grid item xs={12} md={6} sx={{ height: '100%' }}>
      <Box sx={{ width: '100%', height: '100%' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Course Overview
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Activity ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Resource Type</TableCell>
                <TableCell>Interactivity Type</TableCell>
                <TableCell>Interactivity Level</TableCell>
                <TableCell>Semantic Density</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Typical Learning Time</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'averageLearningTime'}
                    direction={orderBy === 'averageLearningTime' ? order : 'asc'}
                    onClick={() => handleRequestSort('averageLearningTime')}
                  >
                    Average Learning Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'averageGrade'}
                    direction={orderBy === 'averageGrade' ? order : 'asc'}
                    onClick={() => handleRequestSort('averageGrade')}
                  >
                    Average Grade
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'averageAttemptsToPass'}
                    direction={orderBy === 'averageAttemptsToPass' ? order : 'asc'}
                    onClick={() => handleRequestSort('averageAttemptsToPass')}
                  >
                    Average Attempts To Pass
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'averageRating'}
                    direction={orderBy === 'averageRating' ? order : 'asc'}
                    onClick={() => handleRequestSort('averageRating')}
                  >
                    Average Rating
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortRows(rows).map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.activityId}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.resourceType}</TableCell>
                  <TableCell>{row.interactivityType}</TableCell>
                  <TableCell>{row.interactivityLevel}</TableCell>
                  <TableCell>{row.semanticDensity}</TableCell>
                  <TableCell>{row.difficulty}</TableCell>
                  <TableCell>{row.typicalLearningTime} min</TableCell>
                  <TableCell>{row.averageLearningTime}</TableCell>
                  <TableCell>{row.averageGrade} points</TableCell>
                  <TableCell>{row.averageAttemptsToPass}</TableCell>
                  <TableCell>{row.averageRating}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Grid>
  );
};

export default CourseOverview;
