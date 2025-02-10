import React, { useState, useMemo } from 'react';
import {
    Card,
    CardContent,
    Typography,
    FormControl,
    InputLabel,
    Select,
    SelectChangeEvent,
    MenuItem,
    Box
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CourseCompletion from './learner/course-completion';
import { Verb, LearnerProfile, XAPIStatement, CourseData } from '../types/types';
import RecommendationService from '../services/recommendation-service';
import LearningTimeChart from './learner/learning-time';
import LearningTimePerSection from './learner/average-time-per-module';
import LearningAttempts from './learner/attempts-to-pass';
import LearningAttemptsCommunity from './learner/attempts-to-pass-community';
import AverageScorePerModule from './learner/average-score-per-module';
import AverageScoreChart from './learner/average-score';
import AverageScoreChartCommunity from './learner/average-score-community';
import ActivityHistory from './learner/activity-history';

interface LearnerDashboardProps {
    learnerProfiles: LearnerProfile[];
    statements: XAPIStatement[];
    verbs: Verb[];
    courseData: CourseData | null;
}

const LearnerDashboard: React.FC<LearnerDashboardProps> = ({
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
            <Box sx={{ width: '100%' }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="learner-select-label" sx={{ color: '#1565C0' }}>Select Learner</InputLabel>
                    <Select
                        labelId="learner-select-label"
                        id="learner-select"
                        value={selectedLearnerId}
                        label="Select Learner"
                        onChange={handleLearnerChange}
                        sx={{
                            bgcolor: '#E3F2FD',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#90CAF9'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1565C0'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1565C0'
                            }
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    maxHeight: 400,
                                    backgroundColor: '#E3F2FD',
                                    borderRadius: 2,
                                    border: '1px solid #90CAF9'
                                }
                            }
                        }}
                    >
                        {[...learnerProfiles]
                            .sort((a, b) => {
                                const numA = parseInt(a.email.match(/\d+/)?.[0] || '0');
                                const numB = parseInt(b.email.match(/\d+/)?.[0] || '0');
                                return numA - numB;
                            })
                            .map((learner) => (
                                <MenuItem key={learner.id} value={learner.id}>
                                    {learner.email} ({learner.personaType})
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>
            </Box>

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
                    minHeight: 0
                }}>
                    {/* Learning Progress Card */}
                    <Card
                        style={{ color: 'black', backgroundColor: '#E3F2FD' }}
                        sx={{
                            minHeight: 0,
                            height: '33%',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                        <CardContent sx={{ height: '100%', p: { xs: 1, md: 2 } }}>
                            <Grid container spacing={1} sx={{ height: '100%' }}>

                                {/* Card Title */}
                                <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                <Grid size={{ xs: 12, md: 3 }} sx={{ height: '100%', p: 0.5 }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <CourseCompletion
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>

                                {/* Learning Time Chart */}
                                <Grid size={{ xs: 12, md: 7 }} sx={{ height: '100%', p: 0.5 }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <LearningTimeChart
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
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
                            height: '33%',
                            border: '1px solid', borderColor: 'divider'                        
                        }
                        } >
                        <CardContent sx={{ height: '100%', p: { xs: 1, md: 2 } }}>
                            <Grid container spacing={1} sx={{ height: '100%' }}>

                                {/* Card Title */}
                                <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                        <span className="text"> Module<br />Performance</span>
                                    </Typography>
                                </Grid>

                                {/* Learning Time Per Section Diagram */}
                                <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%', pb: 3 }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <LearningTimePerSection
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learnerProfile={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>

                                {/* Average Score Per Module Diagram */}
                                <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%', pb: 3 }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <AverageScorePerModule
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learnerProfile={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>

                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Community Comparison Card */}
                    <Card
                        style={{ color: 'black', backgroundColor: '#EDE7F6' }}
                        sx={{
                            minHeight: 0,
                            height: '33%',
                            border: '1px solid', borderColor: 'divider'
                        }          } >
                        <CardContent sx={{ height: '100%', p: { xs: 1, md: 2 } }}>
                            <Grid container spacing={1} sx={{ height: '100%' }}>

                                {/* Card Title */}
                                <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                                background: 'linear-gradient(45deg, #5E35B1, #9575CD)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <span className="emoji">🌍<br /></span>
                                        <span className="text"> Community<br />Comparison</span>
                                    </Typography>
                                </Grid>

                                {/* Average Score Chart */}
                                <Grid size={{ xs: 12, md: 2.5 }} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <AverageScoreChart
                                            statements={filteredData.statements}
                                            learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>

                                {/* Average Score Chart Community */}
                                <Grid size={{ xs: 12, md: 2.5 }} sx={{ height: '100%' }}>
                                    {statements.length > 0 && courseData && selectedLearnerId && (
                                        <AverageScoreChartCommunity
                                            courseData={courseData}
                                            statements={statements}
                                            learners={learnerProfiles} />
                                    )}
                                </Grid>

                                {/* Learning Attempts Chart */}
                                <Grid size={{ xs: 12, md: 2.5 }} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <LearningAttempts
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>

                                {/* Learning Attempts Chart Community */}
                                <Grid size={{ xs: 12, md: 2.5 }} sx={{ height: '100%' }}>
                                    {statements.length > 0 && courseData && selectedLearnerId && (
                                        <LearningAttemptsCommunity
                                            statements={statements}
                                            courseData={courseData}
                                            learners={learnerProfiles}
                                        />
                                    )}
                                </Grid>

                            </Grid>
                        </CardContent>
                    </Card>

                </Box>

                {/* Right Column - Recommendations */}
                <Box sx={{
                    flex: { xs: '1', lg: '0 0 30%' },
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
                            height: {
                                xs: 'auto', lg: 'calc(50% - 6px)'
                            },
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
                                <span className="text"> Activity Recommendations</span>
                            </Typography>

                            {/* Activity Recommendations */}
                            <Grid size={{ xs: 12, md: 12 }} sx={{
                                height: '100%',
                                p: 0.5,
                                pt: 0,
                                pb: 1
                            }}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <Grid size={{ xs: 12, md: 12 }} sx={{
                                        height: '100%',
                                        p: 0.5,
                                        pt: 0,
                                        pb: 1
                                    }}>
                                        <RecommendationService
                                            learnerProfile={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                            statements={filteredData.statements}
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
                            height: {
                                xs: 'auto', lg: 'calc(50% - 6px)'
                            },
                            border: '1px solid', borderColor: 'divider'
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
                                <span className="emoji">📋</span>
                                <span className="text"> Activity History</span>
                            </Typography>

                            {/* Activity History */}
                            <Grid size={{ xs: 12, md: 12 }} sx={{
                                height: '100%',
                                p: 0.5,
                                pt: 0, 
                                pb: 2   
                            }}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <ActivityHistory
                                        learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        statements={filteredData.statements}
                                        courseData={courseData}
                                    />
                                )}
                            </Grid>

                        </CardContent>
                    </Card>

                </Box>
            </Box>
        </Box>
    );
};

export default LearnerDashboard;
