import React, { useMemo } from 'react';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';
import { Typography, Paper, LinearProgress, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';

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
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <Typography variant="body1" gutterBottom>
                Average Learning Time per Module
            </Typography>

            <Grid container sx={{ width: '100%', height: '100%' }}>
                <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {sectionTimeData.slice(0, Math.ceil(sectionTimeData.length / 3)).map(({ section, averageTime }) => (
                        <Paper style={{ color: 'black', backgroundColor: '#eaeaea' }} key={section} elevation={1}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 1, minHeight: '60px'
                            }}>                            <Typography variant="body1" sx={{ fontSize: '0.95rem' }}>{section}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(averageTime)} min
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(averageTime / Math.max(...sectionTimeData.map((item) => item.averageTime))) * 100}
                                sx={{ height: 4, borderRadius: 1 }}
                            />
                        </Paper>
                    ))}
                </Grid>

                <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {sectionTimeData.slice(Math.ceil(sectionTimeData.length / 3), Math.ceil(2 * sectionTimeData.length / 3)).map(({ section, averageTime }) => (
                        <Paper style={{ color: 'black', backgroundColor: '#eaeaea' }} key={section} elevation={1}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 1, minHeight: '60px'
                            }}>                            <Typography variant="body1" sx={{ fontSize: '0.95rem' }}>{section}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(averageTime)} min
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(averageTime / Math.max(...sectionTimeData.map((item) => item.averageTime))) * 100}
                                sx={{ height: 4, borderRadius: 1 }}
                            />
                        </Paper>
                    ))}
                </Grid>

                <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {sectionTimeData.slice(Math.ceil(2 * sectionTimeData.length / 3)).map(({ section, averageTime }) => (
                        <Paper style={{ color: 'black', backgroundColor: '#eaeaea' }} key={section} elevation={1}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 1, minHeight: '60px'
                            }}>                            <Typography variant="body1" sx={{ fontSize: '0.95rem' }}>{section}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(averageTime)} min
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(averageTime / Math.max(...sectionTimeData.map((item) => item.averageTime))) * 100}
                                sx={{ height: 4, borderRadius: 1 }}
                            />
                        </Paper>
                    ))}
                </Grid>

            </Grid>
        </Box>
    );
};

export default AverageTimePerModule;