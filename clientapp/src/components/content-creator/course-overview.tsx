import React, { useMemo, useState } from 'react';
import {
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

const parseDuration = (duration: string | null): number => {
    if (!duration) return 15; // Default to 15 minutes if no duration

    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return 15; // Default to 15 minutes if the duration is not available or malformed.

    const [, hours, minutes, seconds] = matches;
    return (
        (parseInt(hours || '0') * 60) + parseInt(minutes || '0') + Math.ceil(parseInt(seconds || '0') / 60)
    );
};

const CourseOverview: React.FC<CourseOverviewProps> = ({ statements, courseData }) => {
    type SortableColumn = 'resourceType' | 'interactivityType' | 'interactivityLevel' |
        'semanticDensity' | 'difficulty' | 'typicalLearningTime' |
        'averageLearningTime' | 'averageGrade' | 'averageAttemptsToPass' |
        'averageRating';

    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<SortableColumn>('resourceType');

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

    const difficultyMap: Record<string, string> = {
        '0.2': 'very low',
        '0.4': 'low',
        '0.6': 'average',
        '0.8': 'high',
        '1.0': 'very high'
    };

    const parseDifficulty = (difficulty: string | number | null): string => {
        if (difficulty === null) return 'N/A';

        // Convert to string to ensure consistent comparison
        const difficultyStr = difficulty.toString();

        // Check if it's already a mapped string difficulty
        const lowercaseDifficulty = difficultyStr.toLowerCase();
        if (['very low', 'low', 'average', 'high', 'very high'].includes(lowercaseDifficulty)) {
            return lowercaseDifficulty;
        }

        // If it's a numeric value, map to corresponding string
        const closestDifficulty = Object.keys(difficultyMap).reduce((prev, curr) =>
            Math.abs(parseFloat(curr) - parseFloat(difficultyStr)) <
                Math.abs(parseFloat(prev) - parseFloat(difficultyStr)) ? curr : prev
        );

        return difficultyMap[closestDifficulty] || 'N/A';
    };

    const getActivityField = (activityId: string | undefined, field: string) => {
        if (activityId && courseData.sections) {
            const section = courseData.sections.find((s) =>
                s.activities.some((a) => a.id === activityId)
            );

            if (section) {
                const activity = section.activities.find((a) => a.id === activityId);
                const value = (activity as any)?.[field];

                if (field === 'difficulty') {
                    return parseDifficulty(value);
                }

                return value || null;
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
        return overallAverage.toFixed(1); // Return the average grade rounded to 2 decimal places.
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

        return overallAverageAttempts.toFixed(1); // Return the average attempts rounded to 2 decimal places.
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
        return averageRating.toFixed(1); // Return the average rating rounded to 2 decimal places.
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

    const handleRequestSort = (property: SortableColumn) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortRows = (rows: any[]) => {
        const comparator = (a: any, b: any) => {
            // Handle numeric fields
            if (['averageLearningTime', 'averageGrade', 'averageAttemptsToPass', 'averageRating', 'typicalLearningTime'].includes(orderBy)) {
                const aValue = a[orderBy] === 'N/A' ? -1 :
                    orderBy === 'averageLearningTime' ? parseInt(a[orderBy]) :
                        orderBy === 'typicalLearningTime' ? a[orderBy] :
                            parseFloat(a[orderBy]);
                const bValue = b[orderBy] === 'N/A' ? -1 :
                    orderBy === 'averageLearningTime' ? parseInt(b[orderBy]) :
                        orderBy === 'typicalLearningTime' ? b[orderBy] :
                            parseFloat(b[orderBy]);
                return order === 'desc' ? bValue - aValue : aValue - bValue;
            }

            // Handle text fields
            const aValue = (a[orderBy] || '').toString().toLowerCase();
            const bValue = (b[orderBy] || '').toString().toLowerCase();
            if (order === 'desc') {
                return bValue.localeCompare(aValue);
            }
            return aValue.localeCompare(bValue);
        };

        return [...rows].sort(comparator);
    };

    const createSortHandler = (property: SortableColumn) => () => {
        handleRequestSort(property);
    };

    const commonHeaderStyle = {
        fontWeight: 'bold',
        backgroundColor: '#2E7D32',
        color: 'white'
    };

    const commonSortLabelStyle = {
        fontWeight: 'bold',
        color: 'white !important',
        '& .MuiTableSortLabel-icon': {
            color: 'white !important'
        }
    };


    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            overflowY: 'auto',
            paddingRight: 1,
            paddingBottom: 2,
            maxHeight: '100%',
            minHeight: 0
        }}>
            <TableContainer
                component={Paper}
                sx={{
                    height: '100%',
                    overflowX: 'auto',
                    minHeight: 0,
                    marginBottom: 1,
                    paddingRight: 1,
                    backgroundColor: 'transparent',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#9C27B0',  
                        borderRadius: '4px'
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: '#6A3ADB'  
                    }
                }}
            >
                <Table stickyHeader size="small" sx={{
                    '& .MuiTableCell-root': {
                        padding: '5px',
                        fontSize: '0.9rem'
                    },
                    '& .MuiTableCell-head': {
                        backgroundColor: '#9C27B0',
                        color: 'white',
                    },
                    '& .MuiTableCell-body': {
                        '&:nth-of-type(6), &:nth-of-type(7), &:nth-of-type(8), &:nth-of-type(9), &:nth-of-type(10)': {
                            textAlign: 'center'
                        }
                    },
                    width: '100%'
                }}>
                    <TableHead>
                        <TableRow>
                            {[
                                { id: 'resourceType' as SortableColumn, label: 'Resource Type' },
                                { id: 'interactivityType' as SortableColumn, label: 'Interactivity Type' },
                                { id: 'interactivityLevel' as SortableColumn, label: 'Interactivity Level' },
                                { id: 'semanticDensity' as SortableColumn, label: 'Semantic Density' },
                                { id: 'difficulty' as SortableColumn, label: 'Difficulty' },
                                { id: 'typicalLearningTime' as SortableColumn, label: 'Typical Learning Time' },
                                { id: 'averageLearningTime' as SortableColumn, label: 'Average Learning Time' },
                                { id: 'averageGrade' as SortableColumn, label: 'Average Grade' },
                                { id: 'averageAttemptsToPass' as SortableColumn, label: 'Average Attempts to Pass' },
                                { id: 'averageRating' as SortableColumn, label: 'Average Rating' }
                            ].map((column) => (
                                <TableCell
                                    key={column.id}
                                    sx={commonHeaderStyle}
                                >
                                    <TableSortLabel
                                        active={orderBy === column.id}
                                        direction={orderBy === column.id ? order : 'asc'}
                                        onClick={createSortHandler(column.id)}
                                        sx={commonSortLabelStyle}
                                    >
                                        {column.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortRows(rows).map((row, index) => (
                            <TableRow key={index}>
                                <TableCell align="left">{row.resourceType}</TableCell>
                                <TableCell align="left">{row.interactivityType}</TableCell>
                                <TableCell align="left">{row.interactivityLevel}</TableCell>
                                <TableCell align="left">{row.semanticDensity}</TableCell>
                                <TableCell align="left">{row.difficulty}</TableCell>
                                <TableCell align="left">{row.typicalLearningTime} min</TableCell>
                                <TableCell align="left">{row.averageLearningTime}</TableCell>
                                <TableCell align="left">{row.averageGrade} points</TableCell>
                                <TableCell align="left">{row.averageAttemptsToPass}</TableCell>
                                <TableCell align="left">{row.averageRating}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CourseOverview;
