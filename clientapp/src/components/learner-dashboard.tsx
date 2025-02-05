import React, { useState, useMemo } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    FormControl,
    InputLabel,
    Select,
    SelectChangeEvent,
    MenuItem,
    Box,
    useTheme
} from '@mui/material';
import CourseCompletion from './learner/course-completion';
import LearningTimeProps from './learner/learning-time';
import LearningTimePerSection from './learner/average-time-per-module';
import LearningAttempts from './learner/attempts-to-pass';
import LearningAttemptsCommunity from './learner/attempts-to-pass-community';
import AverageScorePerModule from './learner/average-score-per-module';
import AverageScoreChart from './learner/average-score';
import AverageScoreChartCommunity from './learner/average-score-community';
import { Verb, LearnerProfile, XAPIStatement, CourseData } from '../types/types';

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
    const theme = useTheme();
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
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ p: 2, pb: 0 }}>
                <FormControl fullWidth>
                    <InputLabel id="learner-select-label">Select Learner</InputLabel>
                    <Select
                        labelId="learner-select-label"
                        id="learner-select"
                        value={selectedLearnerId}
                        label="Select Learner"
                        onChange={handleLearnerChange}
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

            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    '& .MuiCard-root': {
                        minHeight: '300px', 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    },
                    '& .MuiCardContent-root': {
                        flex: 1, 
                        display: 'flex',
                        flexDirection: 'column',
                        p: 2
                    }
                }}
            >
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Learning Progress
                        </Typography>
                        <Box sx={{ height: '100%' }}>
                            <Grid container spacing={2} sx={{ height: '100%' }}>
                                <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <CourseCompletion
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <LearningTimeProps
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Module Performance
                        </Typography>
                        <Box sx={{ height: '1000' }}>
                            <Grid container spacing={2} sx={{ height: '100%' }}>
                                <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <LearningTimePerSection
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learnerProfile={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <AverageScorePerModule
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learnerProfile={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>

                <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ height: '100%', p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Community Comparison
                        </Typography>
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
                            <Grid container spacing={2} sx={{ height: '100%' }}>
                                <Grid item xs={12} md={3} sx={{ height: 'auto' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <AverageScoreChart
                                            statements={filteredData.statements}
                                            learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>
                                <Grid item xs={12} md={3} sx={{ height: 'auto' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <AverageScoreChartCommunity
                                            statements={statements}
                                            learners={learnerProfiles}
                                        />
                                    )}
                                </Grid>
                        
                                <Grid item xs={12} md={3} sx={{ height: 'auto' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <LearningAttempts
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>
                                <Grid item xs={12} md={3} sx={{ height: 'auto' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <LearningAttemptsCommunity
                                            statements={statements}
                                            courseData={courseData}
                                            learners={learnerProfiles}
                                        />
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                       
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default LearnerDashboard;