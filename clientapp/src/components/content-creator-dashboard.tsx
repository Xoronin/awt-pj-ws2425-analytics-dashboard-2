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
import { Verb, LearnerProfile, XAPIStatement, LearningSession, CourseData } from '../types/types';

interface LearnerDashboardProps {
    learnerProfiles: LearnerProfile[];
    sessions: Map<string, LearningSession[]>;
    statements: XAPIStatement[];
    verbs: Verb[];
    courseData: CourseData | null;
}

const ContentCreatorsDashboard: React.FC<LearnerDashboardProps> = ({
    learnerProfiles,
    sessions,
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
            ),
            learnerSessions: sessions.get(selectedLearnerId) || []
        };
    }, [selectedLearnerId, statements, sessions, learnerProfiles]);

    const handleLearnerChange = (event: SelectChangeEvent) => {
        setSelectedLearnerId(event.target.value);
    };

    return (
        <Box
            sx={{
                height: 'calc(100vh - 48px)', // Adjust based on your layout
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 2
            }}
        >
            {/* Learner Selector */}
            <FormControl sx={{ minHeight: 'auto' }}>
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

            {/* Main Content */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
                {/* Learning Progress */}
                <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Learning Progress
                        </Typography>
                        <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                            <Grid item xs={12} md={6}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <CourseCompletion
                                        sessions={new Map([[selectedLearnerId, filteredData.learnerSessions]])}
                                        statements={filteredData.statements}
                                        courseData={courseData}
                                        learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <CourseCompletion
                                        sessions={new Map([[selectedLearnerId, filteredData.learnerSessions]])}
                                        statements={filteredData.statements}
                                        courseData={courseData}
                                        learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                    />
                                )}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Module Performance */}
                <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Module Performance
                        </Typography>
                        <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                            <Grid item xs={12} md={6}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <CourseCompletion
                                        sessions={new Map([[selectedLearnerId, filteredData.learnerSessions]])}
                                        statements={filteredData.statements}
                                        courseData={courseData}
                                        learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <CourseCompletion
                                        sessions={new Map([[selectedLearnerId, filteredData.learnerSessions]])}
                                        statements={filteredData.statements}
                                        courseData={courseData}
                                        learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                    />
                                )}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Community Comparison */}
                <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Community Comparison
                        </Typography>
                        <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                            <Grid item xs={12} md={6}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <CourseCompletion
                                        sessions={new Map([[selectedLearnerId, filteredData.learnerSessions]])}
                                        statements={filteredData.statements}
                                        courseData={courseData}
                                        learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (
                                    <CourseCompletion
                                        sessions={new Map([[selectedLearnerId, filteredData.learnerSessions]])}
                                        statements={filteredData.statements}
                                        courseData={courseData}
                                        learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}
                                    />
                                )}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default ContentCreatorsDashboard;