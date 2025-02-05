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

interface LearnerDashboardProps {
    learnerProfiles: LearnerProfile[];
    statements: XAPIStatement[];
    verbs: Verb[];
    courseData: CourseData | null;
}

const ContentCreatorsDashboard: React.FC<LearnerDashboardProps> = ({
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
        if (!selectedLearnerId) return { statements: [], learnerSessions: [] };

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
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ flex: 1, display: 'flex', height: '100%', pt: 1.5, pb: 1 }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="learner-select-label">Select Learner</InputLabel>
                    <Select
                        labelId="learner-select-label"
                        id="learner-select"
                        value={selectedLearnerId}
                        label="Select Learner"
                        onChange={handleLearnerChange}
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    maxHeight: 400,
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '10px',
                                },
                            },
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

            <Box sx={{ flex: 1, display: 'flex', gap: 2, height: 'calc(100% - 80px)', '&:last-child': { pb: 2 } }}>

                {/* Left Column */}
                <Box sx={{ flex: '0 0 75%', display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>

                    {/* Learning Progress Card */}
                    <Card style={{ color: 'black', backgroundColor: '#eaeaea' }} sx={{ height: 'calc(33.333% - 11px)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
                            <Grid container spacing={3} sx={{ height: '100%' }}>

                                {/* Card Title */}
                                <Grid size={{ xs: 12, md: 2 }} sx={{ height: '100%', p: 0.5 }}>
                                    <Typography variant="h6" sx={{ flex: '0 0 auto' }}>
                                        📖 Learning Progress
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
                    <Card style={{ color: 'black', backgroundColor: '#eaeaea' }} sx={{ height: 'calc(33.333% - 11px)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
                            <Grid container spacing={1} sx={{ height: '100%' }}>

                                {/* Card Title */}
                                <Grid size={{ xs: 12, md: 2 }} sx={{ height: '100%', p: 0.5 }}>
                                    <Typography variant="h6" sx={{ flex: '0 0 auto' }}>
                                        📊 Module Performance
                                    </Typography>
                                </Grid>

                                {/* Learning Time Per Section Diagram */}
                                <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                        <LearningTimePerSection
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                            learnerProfile={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                        />
                                    )}
                                </Grid>

                                {/* Average Score Per Module Diagram */}
                                <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%' }}>
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
                    <Card style={{ color: 'black', backgroundColor: '#eaeaea' }} sx={{ height: 'calc(33.333% - 11px)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
                            <Grid container spacing={1} sx={{ height: '100%' }}>

                                {/* Card Title */}
                                <Grid size={{ xs: 12, md: 2 }} sx={{ height: '100%', p: 0.5 }}>
                                    <Typography variant="h6" sx={{ flex: '0 0 auto' }}>
                                        🌍 Community Comparison
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
                <Card style={{ color: 'black', backgroundColor: '#eaeaea' }}
                    sx={{
                        flex: '0 0 25%',
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%'
                    }}>
                    <CardContent>

                        {/* Card Title */}
                        <Typography variant="h6" gutterBottom>
                            🎯 Activity Recommendations
                        </Typography>

                        {/* Recommendation Service */}
                        <Box sx={{ height: 'calc(100% - 32px)' }}>
                            <Grid container sx={{ height: '100%' }}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <Grid size={{ xs: 12 }} sx={{ height: '100%' }}>
                                        <RecommendationService
                                            learnerProfile={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>

            </Box>
        </Box>
    );
};

export default ContentCreatorsDashboard;