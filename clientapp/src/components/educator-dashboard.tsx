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
    Box
} from '@mui/material';
import CourseCompletion from './learner/course-completion';
import { Verb, LearnerProfile, XAPIStatement, CourseData } from '../types/types';
import RecommendationService from '../services/recommendation-service';

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
        <Box
            sx={{
                height: '100%',
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
                        height: '300px',
                        mb: 2,
                        '&:last-child': {
                            mb: 0
                        }
                    },
                    '& .MuiCardContent-root': {
                        height: '100%',
                        p: 2,
                        '&:last-child': {
                            pb: 2
                        }
                    }
                }}
            >
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            📖 Learning Progress
                        </Typography>
                        <Box sx={{ height: 'calc(100% - 32px)' }}>
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
                                        <CourseCompletion
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
                            📊 Module Performance
                        </Typography>
                        <Box sx={{ height: 'calc(100% - 32px)' }}>
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
                                        <CourseCompletion
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
                            🌍 Community Comparison
                        </Typography>
                        <Box sx={{ height: 'calc(100% - 32px)' }}>
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
                                        <CourseCompletion
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
                            🎯 Activity Recommendations
                        </Typography>
                        <Box sx={{ height: 'calc(100% - 32px)' }}>
                            <Grid container spacing={2} sx={{ height: '100%' }}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <Grid item xs={12} sx={{ height: '100%' }}>
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

export default EducatorsDashboard;