import {
    Box, Card,
    CardContent, SelectChangeEvent, Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useMemo, useState } from 'react';
import CumulativeRec from '../services/cumulative-rec';
import StudentGradeRec from '../services/grades-rec';
import { CourseData, LearnerProfile, Verb, XAPIStatement } from '../types/types';
import AttemptsEducator from './educator/attempts-educator';
import AverageScoreEducator from './educator/average-score-educator';
import CourseBoxplot from './educator/course-boxplot';
import LineTimeChartCumulative from './educator/learning-time-cumulaitve';
import StudentPerformanceTable from './educator/performance-table';

interface LearnerDashboardProps {
    learnerProfiles: LearnerProfile[];
    statements: XAPIStatement[];
    verbs: Verb[];
    courseData: CourseData | null;
}

const EducatorsDashboard: React.FC<LearnerDashboardProps> = ({
    learnerProfiles,
    statements,
    verbs,
    courseData
}) => {
    const [selectedLearnerId, setSelectedLearnerId] = useState<string>('');

    React.useEffect(() => {
        if (learnerProfiles.length > 0 && !selectedLearnerId) {
            setSelectedLearnerId(learnerProfiles[0].id);
        }
    }, [learnerProfiles, selectedLearnerId]);

    const filteredData = useMemo(() => {
        if (!selectedLearnerId) return { statements: [] };

        return {
            statements: statements.filter(statement =>
                statement.actor.mbox === learnerProfiles.find(l => l.id === selectedLearnerId)?.email
            )
        };
    }, [selectedLearnerId, statements, learnerProfiles]);

    const handleLearnerChange = (event: SelectChangeEvent) => {
        setSelectedLearnerId(event.target.value);
    };

    return (
        <Box sx={{
            height: 'calc(100% - 16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: { xs: 1 },
            overflow: 'hidden'
        }}>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 2,
                height: '100%',
                overflow: 'hidden'
            }}>
                {/* Left Column */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    overflow: 'hidden'
                }}>
                    {/* Learning Progress Card */}
                    <Card
                        style={{ color: 'black', backgroundColor: '#E3F2FD' }}
                        sx={{
                            minHeight: 0,
                            height: '50%',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                        <CardContent sx={{
                            height: '100%',
                            p: { xs: 1, md: 2 },
                        }}>
                            <Grid container spacing={1} sx={{ height: '100%' }}>

                                {/* Card Title */}
                                <Grid size={{ xs: 12, md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography
                                        sx={{
                                            fontSize: '1.8rem',
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            letterSpacing: '0.5px',
                                            '& .emoji': {
                                                WebkitBackgroundClip: 'text',
                                                backgroundClip: 'text'
                                            },
                                            '& .text': {
                                                background: 'linear-gradient(45deg, #1565C0, #42A5F5)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <span className="emoji">📖<br /></span>
                                        <span className="text"> Learning<br />Progress</span>
                                    </Typography>
                                </Grid>

                                {/* Course Completion Pie Chart */}
                                <Grid size={{ xs: 12, md: 6.8 }} sx={{ height: '100%', p: 0.5 }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <LineTimeChartCumulative
                                            statements={statements}
                                            learnerProfiles={learnerProfiles} />
                                    )}
                                </Grid>

                                {/* Learning Time Chart */}
                                <Grid size={{ xs: 12, md: 2 }} sx={{ height: '100%', p: 0.5 }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <AverageScoreEducator
                                            statements={statements}
                                            learners={learnerProfiles}
                                            courseData={courseData} />
                                    )}
                                </Grid>

                                {/* Learning Time Chart */}
                                <Grid size={{ xs: 12, md: 2 }} sx={{ height: '100%', p: 0.5 }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <AttemptsEducator
                                            statements={statements}
                                            courseData={courseData}
                                            learners={learnerProfiles}
                                        />
                                    )}
                                </Grid>

                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Module Performance Card */}
                    <Card
                        style={{ color: 'black', backgroundColor: '#E8F5E9' }}
                        sx={{
                            minHeight: 0,
                            height: '50%',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                        <CardContent sx={{
                            height: '100%',
                            p: { xs: 1, md: 2 },
                        }}>
                            <Grid container spacing={2} sx={{ height: '100%' }}>

                                {/* Card Title */}
                                <Grid size={{ xs: 12, md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography
                                        sx={{
                                            fontSize: '1.8rem',
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            letterSpacing: '0.5px',
                                            '& .emoji': {
                                                WebkitBackgroundClip: 'text',
                                                backgroundClip: 'text'
                                            },
                                            '& .text': {
                                                background: 'linear-gradient(45deg, #2E7D32, #66BB6A)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <span className="emoji">📊<br /></span>
                                        <span className="text"> Modules <br/> Statistics</span>
                                    </Typography>
                                </Grid>

                                {/* Learning Time Per Section Diagram */}
                                <Grid size={{ xs: 12, md: 5.4 }} sx={{ height: '100%', p: 2 }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <CourseBoxplot
                                            statements={statements}
                                            courseData={courseData}
                                        />
                                    )}
                                </Grid>

                                {/* Average Score Per Module Diagram */}
                                <Grid size={{ xs: 12, md: 5.4 }} sx={{ height: '100%', p: 1 }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <StudentPerformanceTable
                                            statements={statements}
                                        />
                                    )}
                                </Grid>

                            </Grid>
                        </CardContent>
                    </Card>         

                </Box>

                {/* Right Column - Recommendations */}
                <Box sx={{
                    flex: { xs: '1', lg: '0 0 25%' },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden'
                }}>
                    <Card
                        style={{ color: 'black', backgroundColor: '#FFF3E0' }}
                        sx={{
                            height: '50%',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                        <CardContent sx={{ height: '100%', p: { xs: 1, md: 1 } }}>

                            {/* Card Title */}
                            <Typography
                                sx={{
                                    fontSize: '1.8rem',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    letterSpacing: '0.5px',
                                    pb: 1,
                                    '& .emoji': {
                                        WebkitBackgroundClip: 'text',
                                        backgroundClip: 'text'
                                    },
                                    '& .text': {
                                        background: 'linear-gradient(45deg, #E65100, #FFA726)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                    }
                                }}
                            >
                                <span className="emoji">🎯</span>
                                <span className="text"> Grades Recommendations</span>
                            </Typography>

                            {/* Grades Recommendations */}
                            <Grid size={{ xs: 12, md: 12 }} sx={{
                                height: '100%',
                                p: 0.5,
                                pt: 0,
                                pb: 1
                            }}>
                                {filteredData.statements.length > 0 && courseData && (
                                    <Grid size={{ xs: 12, md: 12 }} sx={{
                                        height: '100%',
                                        p: 0.5,
                                        pt: 0,
                                        pb: 1
                                    }}>
                                        <StudentGradeRec
                                            statements={statements}
                                            courseData={courseData}
                                        />
                                    </Grid>
                                )}
                            </Grid>

                        </CardContent>
                    </Card>

                    <Card
                        style={{ color: 'black', backgroundColor: '#FFF9C4' }}
                        sx={{
                            height: '50%',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                        <CardContent sx={{ height: '100%', p: { xs: 1, md: 1 } }}>

                            {/* Card Title */}
                            <Typography
                                sx={{
                                    fontSize: '1.8rem',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    letterSpacing: '0.5px',
                                    pb: 1,
                                    '& .emoji': {
                                        WebkitBackgroundClip: 'text',
                                        backgroundClip: 'text'
                                    },
                                    '& .text': {
                                        background: 'linear-gradient(45deg, #F57F17, #FBC02D)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                    }
                                }}
                            >
                                <span className="emoji">🚀</span>
                                <span className="text"> Student Commitment</span>
                            </Typography>

                            {/* Student Commitment */}
                            <Grid size={{ xs: 12, md: 12 }} sx={{
                                height: '100%',
                                p: 0.5,
                                pt: 0,
                                pb: 1
                            }}>
                                {filteredData.statements.length > 0 && courseData && (
                                    <Grid size={{ xs: 12, md: 12 }} sx={{
                                        height: '100%',
                                        p: 0.5,
                                        pt: 0,
                                        pb: 1
                                    }}>
                                        <CumulativeRec
                                            statements={statements}
                                            learnerProfiles={learnerProfiles}
                                        />
                                    </Grid>
                                )}
                            </Grid>

                        </CardContent>
                    </Card>

                </Box>

            </Box>
        </Box>
    );
};

export default EducatorsDashboard;