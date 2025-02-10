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

interface AverageScorePerModuleProps {
    learnerProfile: LearnerProfile;
    statements: XAPIStatement[];
    courseData: CourseData;
}

const FIXED_SECTIONS = [
    "Grundlagen der Baumpflege",
    "Grundlagen der Instandhaltung",
    "Grundlagen des Kletterns"
];

const parseScore = (score: any): number => {
    // Falls kein Score vorhanden ist, default auf 0
    return score?.raw ?? 0;
};

const AverageScorePerModule: React.FC<AverageScorePerModuleProps> = ({ learnerProfile, statements, courseData }) => {
    const sectionScores = FIXED_SECTIONS.reduce((acc, section) => {
        const sectionData = statements
            .filter(s =>
                s.actor.mbox === learnerProfile.email &&
                s.verb.id === 'http://adlnet.gov/expapi/verbs/scored' &&
                s.result?.score &&
                courseData.sections.find(cs =>
                    cs.title === section &&
                    cs.activities.some(a =>
                        a.id === s.object.definition.extensions?.['https://w3id.org/learning-analytics/learning-management-system/external-id']
                    )
                )
            );

        if (sectionData.length > 0) {
            const totalScore = sectionData.reduce((sum, s) => sum + parseScore(s.result!.score), 0);
            acc[section] = {
                averageScore: totalScore / sectionData.length,
                hasData: true
            };
        } else {
            acc[section] = { averageScore: 0, hasData: false };
        }
        return acc;
    }, {} as Record<string, { averageScore: number; hasData: boolean }>);

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Typography
                sx={{
                    fontSize: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#2E7D32',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    mb: '1%'
                }}
            >
                Average Score per Module
            </Typography>

            <Box sx={{
                height: 'calc(100% - 11px)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                gap: 1,
                paddingRight: 1,
                paddingBottom: 1,
                maxHeight: '100%',
                minHeight: 0,
                '& .MuiTableContainer-root': {
                    mb: 1
                },
                '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px'
                },
                '&::-webkit-scrollbar-thumb': {
                    background: '#2E7D32',
                    borderRadius: '4px'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    background: '#A5D6A7'
                }
            }}>
                {FIXED_SECTIONS.map(section => (
                    <Paper
                        key={section}
                        sx={{
                            flex: 1,
                            backgroundColor: '#E8F5E9',
                            border: '1px solid',
                            borderColor: '#81C784',
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>

                        <Typography sx={{
                            fontSize: '0.9rem',
                            fontWeight: 500,
                        }}>
                            {section}
                        </Typography>

                        <Typography sx={{
                            fontSize: '0.8rem',
                            fontWeight: 500
                        }}>
                            {sectionScores[section]?.hasData ?
                                `${Math.round(sectionScores[section].averageScore)}%` :
                                'No data available'}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={sectionScores[section]?.averageScore || 0}
                            sx={{
                                height: 6,
                                borderRadius: 2,
                                opacity: sectionScores[section]?.hasData ? 1 : 0.4,
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#2E7D32'
                                },
                                backgroundColor: '#A5D6A7'
                            }}
                        />
                    </Paper>
                ))}
            </Box>
        </Box>
    );
};

export default AverageScorePerModule;