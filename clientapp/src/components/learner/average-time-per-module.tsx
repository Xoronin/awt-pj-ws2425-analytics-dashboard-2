import React from 'react';
import { XAPIStatement, LearnerProfile, CourseData } from '../../types/types';
import { Typography, Paper, LinearProgress, Box } from '@mui/material';
import { ParseDuration } from '../../helper/helper';


interface AverageTimePerModuleProps {
    learnerProfile: LearnerProfile;
    statements: XAPIStatement[];
    courseData: CourseData;
}

const FIXED_SECTIONS = [
    "Grundlagen der Baumpflege",
    "Grundlagen der Instandhaltung",
    "Grundlagen des Kletterns"
];

/**
 * Displays a learner's average time spent across different course modules using progress bars.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {LearnerProfile} props.learnerProfile - The learner's profile data
 * @param {XAPIStatement[]} props.statements - Array of xAPI statements for analysis
 * @param {CourseData} props.courseData - Structured course data containing sections and activities
 * 
 * @returns {React.ReactElement} A visual representation of time spent per module with progress bars
*/
const AverageTimePerModule: React.FC<AverageTimePerModuleProps> = ({ learnerProfile, statements, courseData }) => {

    /**
     * Calculates the average time spent in each fixed module/section.
     * Filters statements by learner, checks for duration data, and finds the matching section.
     * 
     * @returns {Object} Object containing average time data per section
     * @property {number} averageTime - Average time spent in minutes
     * @property {boolean} hasData - Whether there's time data available for this section
     */
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
            const totalTime = sectionData.reduce((sum, s) => sum + ParseDuration(s.result?.duration || 'PT0M'), 0);
            acc[section] = {
                averageTime: totalTime / sectionData.length,
                hasData: true
            };
        } else {
            acc[section] = { averageTime: 0, hasData: false };
        }
        return acc;
    }, {} as Record<string, { averageTime: number; hasData: boolean }>);

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
                Average Learning Time per Module
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
                            {sectionTimes[section]?.hasData ?
                                `${Math.round(sectionTimes[section].averageTime)} min` :
                                'No data available'}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={sectionTimes[section]?.averageTime || 0}
                            sx={{
                                height: 6,
                                borderRadius: 2,
                                opacity: sectionTimes[section]?.hasData ? 1 : 0.4,
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

export default AverageTimePerModule;