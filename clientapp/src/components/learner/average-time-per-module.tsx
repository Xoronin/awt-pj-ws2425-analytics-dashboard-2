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

const FIXED_SECTIONS = [
    "Grundlagen der Baumpflege",
    "Grundlagen der Instandhaltung",
    "Grundlagen des Kletterns"
];

const AverageTimePerModule: React.FC<AverageTimePerModuleProps> = ({ learnerProfile, statements, courseData }) => {

    const sectionTimes = FIXED_SECTIONS.reduce((acc, section) => {
        const sectionData = statements
            .filter(s =>
                s.actor.mbox === learnerProfile.email &&
                s.result?.duration &&
                courseData.sections.find(cs =>
                    cs.title === section &&
                    cs.activities.some(a =>
                        a.id === s.object.definition.extensions?.['https://w3id.org/learning-analytics/learning-management-system/external-id']
                    )
                )
            );

        if (sectionData.length > 0) {
            const totalTime = sectionData.reduce((sum, s) => sum + parseDuration(s.result?.duration || 'PT0M'), 0);
            acc[section] = {
                averageTime: totalTime / sectionData.length,
                hasData: true
            };
        } else {
            acc[section] = { averageTime: 0, hasData: false };
        }
        return acc;
    }, {} as Record<string, { averageTime: number; hasData: boolean }>);

    const maxTime = Math.max(...Object.values(sectionTimes).map(t => t.averageTime));

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            <Typography
                sx={{
                    fontSize: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#2E7D32',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}
            >
                Average Learning Time per Module
            </Typography>

            <Grid container spacing={1} sx={{
                width: '100%',
                height: '100%',
                px: 1
            }}>
                {FIXED_SECTIONS.map(section => (
                    <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }} key={section}>
                        <Paper sx={{
                            backgroundColor: '#E8F5E9',
                            border: '1px solid',
                            borderColor: '#81C784',
                            p: 1,
                            minHeight: '70px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}>
                            <Typography variant="body1" sx={{
                                fontSize: '1.1rem',
                                fontWeight: 500,
                                color: '#2E7D32'  
                            }}>
                                {section}
                            </Typography>
                            <Typography variant="body2" sx={{
                                fontSize: '1rem',
                                color: '#1B5E20',
                                fontWeight: 500
                            }}>
                                {sectionTimes[section]?.hasData ?
                                    `${Math.round(sectionTimes[section].averageTime)} min` :
                                    'No data available'}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={sectionTimes[section]?.averageTime || 0}
                                sx={{
                                    height: 8,
                                    borderRadius: 2,
                                    opacity: sectionTimes[section]?.hasData ? 1 : 0.4,
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#2E7D32'
                                    },
                                    backgroundColor: '#A5D6A7',
                                    mt: 'auto'
                                }}
                            />
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default AverageTimePerModule;