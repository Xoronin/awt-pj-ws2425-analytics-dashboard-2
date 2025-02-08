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
import CourseCompletion from './learner/course-completion'; //TODO: remove
import CourseRatings from './content-creator/course-ratings';
import CourseTime from './content-creator/course-time';
import CourseOverview from './content-creator/course-overview';
import CoursesCompletedBefore from './content-creator/courses-completed-before';

import { Verb, LearnerProfile, XAPIStatement, CourseData } from '../types/types';

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
    const [SelectedCourseName, setSelectedCourseName] = useState<string>('');

    const availableCourses = useMemo(() => {
        const uniqueCourses = Array.from(new Set(statements.map(statement => statement.object.definition.name.en)));
        return uniqueCourses;
    }, [statements]);

    React.useEffect(() => {
        if (availableCourses.length > 0 && !SelectedCourseName) {
            setSelectedCourseName(availableCourses[0]);  // Set the first course as default
        }
    }, [availableCourses, SelectedCourseName]);

    const filteredData = useMemo(() => {
        if (!SelectedCourseName) return { statements: [] };

        return {
            statements: statements.filter(statement =>
                statement.object.definition.name.en === SelectedCourseName
            )
        };
    }, [SelectedCourseName, statements]);

    const handleCourseChange = (event: SelectChangeEvent) => {
        setSelectedCourseName(event.target.value);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, pb: 0 }}>
                <FormControl fullWidth>
                    <InputLabel id="course-select-label">Select Course</InputLabel>
                    <Select
                        labelId="course-select-label"
                        id="course-select"
                        value={SelectedCourseName}
                        label="Select Course"
                        onChange={handleCourseChange}
                    >
                        {availableCourses.map((course) => (
                            <MenuItem key={course} value={course}>
                                {course}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Learning Progress for {SelectedCourseName}
                        </Typography>
                        <Box sx={{ height: 'calc(100% - 32px)' }}>
                            <Grid container spacing={2} sx={{ height: '100%' }}>
                            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && (
                                        <CourseRatings
                                            statements={filteredData.statements} />
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && (
                                        <CourseTime 
                                        statements={filteredData.statements}
                                        courseData={courseData}
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
                        <Box sx={{ height: 'calc(100% - 32px)' }}>
                            <Grid container spacing={2} sx={{ height: '100%' }}>

                            </Grid>
                            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && (
                                        <CoursesCompletedBefore
                                            statements={statements}
                                            courseData={courseData}
                                            SelectedCourseName={SelectedCourseName}
                                    />
                                    )}
                                </Grid>
                            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && (
                                        <CourseOverview 
                                        statements={statements} 
                                        courseData={courseData} 
                                    />
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
