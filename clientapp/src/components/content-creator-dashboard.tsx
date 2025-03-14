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
import { XAPIStatement, CourseData } from '../types/types';
import CourseOverview from './content-creator/course-overview';
import ActivityRatings from './content-creator/activity-ratings';
import ActivityTime from './content-creator/activity-time';
import ActivitiesCompletedBefore from './content-creator/activities-completed-before';
import RatingsRec from '../services/ratings-rec';

interface ContentCreatorsDashboardProps {
    statements: XAPIStatement[];
    courseData: CourseData | null;
}

const ContentCreatorsDashboard: React.FC<ContentCreatorsDashboardProps> = ({
    statements,
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
                    <InputLabel id="learner-select-label" sx={{ color: '#1565C0' }}>Select Activity</InputLabel>
                    <Select
                        labelId="learner-select-label"
                        id="learner-select"
                        value={SelectedCourseName}
                        label="Select Learner"
                        onChange={handleCourseChange}
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
                        {availableCourses.map((course) => (
                            <MenuItem key={course} value={course}>
                                {course}
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
                    flex: { xs: '1' },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    {/* Activity Review Card */}
                    <Card
                        style={{ color: 'black', backgroundColor: '#E3F2FD' }}
                        sx={{
                            minHeight: 0,
                            height: '50%',
                            border: '1px solid', borderColor: 'divider'
                        }} >
                        <CardContent sx={{ height: '100%', p: { xs: 1, md: 2 } }}>
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
                                        <span className="text"> Activity<br />Review </span>
                                    </Typography>
                                </Grid>

                                {/* Course Ratings Chart */}
                                <Grid size={{ xs: 12, md: 5.4 }} sx={{ height: '100%', p: 0.5 }}>
                                    {filteredData.statements.length > 0 && courseData && (
                                        <ActivityRatings
                                            statements={filteredData.statements}
                                        />
                                    )}
                                </Grid>

                                {/* Course Time Chart */}
                                <Grid size={{ xs: 12, md: 5.4 }} sx={{ height: '100%', p: 0.5 }}>
                                    {filteredData.statements.length > 0 && courseData && (
                                        <ActivityTime
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                        />
                                    )}
                                </Grid>

                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Course Overview Card */}
                    <Card
                        style={{ color: 'black', backgroundColor: '#EDE7F6' }}
                        sx={{
                            minHeight: 0,
                            height: '50%',
                            border: '1px solid', borderColor: 'divider'
                        }} >
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 1, md: 2 } }}>
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
                                                background: 'linear-gradient(45deg, #5E35B1, #9575CD)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <span className="emoji">📊<br /></span>
                                        <span className="text"> Course<br />Overview</span>
                                    </Typography>
                                </Grid>

                                {/* Course Overview Diagram */}
                                <Grid size={{ xs: 12, md: 10.8 }} sx={{ height: '100%', p: 0.5, pr: 0 }}>
                                    {filteredData.statements.length > 0 && courseData && (
                                        <CourseOverview
                                            statements={statements}
                                            courseData={courseData}
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
                                <span className="emoji">⭐</span>
                                <span className="text"> Ratings</span>
                            </Typography>

                            {/* Ratings */}
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
                                        <RatingsRec
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
                                <span className="emoji">🔢</span>
                                <span className="text"> Completion Order</span>
                            </Typography>

                            {/* Completion Order */}
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
                                        <ActivitiesCompletedBefore
                                            statements={statements}
                                            courseData={courseData}
                                            SelectedCourseName={SelectedCourseName}
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

export default ContentCreatorsDashboard;