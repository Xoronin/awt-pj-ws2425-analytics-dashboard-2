﻿import React, { useState, useMemo } from 'react';
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
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: { xs: 1 }
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
                gap: 1,
                height: { xs: 'auto', lg: 'calc(100% - 80px)' }
            }}>
                {/* Left Column */}
                <Box sx={{
                    flex: { xs: '1' },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    {/* Summary Card */}
                    <Card
                        style={{ color: 'black', backgroundColor: '#E3F2FD' }}
                        sx={{
                            minHeight: { xs: 'auto', md: '300px' },
                            height: {
                                xs: 'auto', lg: 'calc(33.333% - 11px)'
                            },
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
                                                background: 'linear-gradient(45deg, #1565C0, #42A5F5)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <span className="emoji">📖<br /></span>
                                        <span className="text"> Summary</span>
                                    </Typography>
                                </Grid>

                                {/* Course Ratings Chart */}
                                <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%', p: 0.5 }}>
                                    {filteredData.statements.length > 0 && courseData && (
                                        <ActivityRatings
                                            statements={filteredData.statements}
                                        />
                                    )}
                                </Grid>

                                {/* Course Time Chart */}
                                <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%', p: 0.5 }}>
                                    {filteredData.statements.length > 0 && courseData &&  (
                                        <ActivityTime
                                            statements={filteredData.statements}
                                            courseData={courseData}
                                        />
                                    )}
                                </Grid>

                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Completion Order Card */}
                    <Card
                        style={{ color: 'black', backgroundColor: '#E8F5E9' }}
                        sx={{
                            minHeight: { xs: 'auto', md: '300px' },
                            height: {
                                xs: 'auto', lg: 'calc(33.333% - 11px)'
                            },
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
                                        <span className="emoji">🔢<br /></span>
                                        <span className="text"> Completion<br />Order</span>
                                    </Typography>
                                </Grid>

                                {/* Courses Completed Before Diagram */}
                                <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && (
                                        <ActivitiesCompletedBefore
                                            statements={statements}
                                            courseData={courseData}
                                            SelectedCourseName={SelectedCourseName}
                                        />
                                    )}
                                </Grid>

                                {/* Course Overview Diagram */}
                                <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%' }}>
                                    {filteredData.statements.length > 0 && courseData && (
                                        <ActivitiesCompletedBefore
                                            statements={statements}
                                            courseData={courseData}
                                            SelectedCourseName={SelectedCourseName}
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
                            minHeight: { xs: 'auto', md: '300px' },
                            height: {
                                xs: 'auto', lg: 'calc(33.333% - 11px)'
                            },
                            border: '1px solid', borderColor: 'divider'
                        }
                        } >
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 1, md: 2 } }}>
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
                                        <span className="emoji">📊<br /></span>
                                        <span className="text"> Course<br />Overview</span>
                                    </Typography>
                                </Grid>

                                {/* Course Overview Diagram */}
                                <Grid size={{ xs: 12, md: 10 }} sx={{ height: '100%', p: 1.5 }}>
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
                {/*<Box sx={{*/}
                {/*    flex: { xs: '1', lg: '0 0 30%' },*/}
                {/*    display: 'flex',*/}
                {/*    flexDirection: 'column',*/}
                {/*    gap: 2,*/}
                {/*    width: '100%',*/}
                {/*    maxWidth: '100%',*/}
                {/*    overflow: 'hidden'*/}
                {/*}}>*/}
                {/*    <Card*/}
                {/*        style={{ color: 'black', backgroundColor: '#FFF3E0' }}*/}
                {/*        sx={{*/}
                {/*            height: {*/}
                {/*                xs: 'auto', lg: 'calc(50% - 6px)'*/}
                {/*            },*/}
                {/*            border: '1px solid', borderColor: 'divider'*/}
                {/*        }}>*/}
                {/*        <CardContent sx={{ height: '100%', p: { xs: 1, md: 2 } }}>*/}

                {/*            */}{/* Card Title */}
                {/*            <Typography*/}
                {/*                sx={{*/}
                {/*                    fontSize: '1.8rem',*/}
                {/*                    textAlign: 'center',*/}
                {/*                    fontWeight: 600,*/}
                {/*                    letterSpacing: '0.5px',*/}
                {/*                    pb: 1,*/}
                {/*                    '& .emoji': {*/}
                {/*                        WebkitBackgroundClip: 'text',*/}
                {/*                        backgroundClip: 'text'*/}
                {/*                    },*/}
                {/*                    '& .text': {*/}
                {/*                        background: 'linear-gradient(45deg, #E65100, #FFA726)',*/}
                {/*                        WebkitBackgroundClip: 'text',*/}
                {/*                        WebkitTextFillColor: 'transparent',*/}
                {/*                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'*/}
                {/*                    }*/}
                {/*                }}*/}
                {/*            >*/}
                {/*                <span className="emoji">🎯</span>*/}
                {/*                <span className="text"> Activity Recommendations</span>*/}
                {/*            </Typography>*/}

                {/*            */}{/* Activity Recommendations */}
                {/*            <Grid container sx={{ height: '100%' }}>*/}
                {/*                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (*/}
                {/*                    <Grid size={{ xs: 12, md: 12 }} sx={{ height: 'calc(100%-11px)', p: 0.5 }}>*/}
                {/*                        <RecommendationService*/}
                {/*                            learnerProfile={learnerProfiles.find(l => l.id === selectedLearnerId)!}*/}
                {/*                            statements={filteredData.statements}*/}
                {/*                            courseData={courseData}*/}
                {/*                        />*/}
                {/*                    </Grid>*/}
                {/*                )}*/}
                {/*            </Grid>*/}

                {/*        </CardContent>*/}
                {/*    </Card>*/}

                {/*    <Card*/}
                {/*        style={{ color: 'black', backgroundColor: '#FFF9C4' }}*/}
                {/*        sx={{*/}
                {/*            height: {*/}
                {/*                xs: 'auto', lg: 'calc(50% - 6px)'*/}
                {/*            },*/}
                {/*            border: '1px solid', borderColor: 'divider'*/}
                {/*        }}>*/}
                {/*        <CardContent sx={{ height: '100%', p: { xs: 1, md: 2 } }}>*/}

                {/*            */}{/* Card Title */}
                {/*            <Typography*/}
                {/*                sx={{*/}
                {/*                    fontSize: '1.8rem',*/}
                {/*                    textAlign: 'center',*/}
                {/*                    fontWeight: 600,*/}
                {/*                    letterSpacing: '0.5px',*/}
                {/*                    pb: 1,*/}
                {/*                    '& .emoji': {*/}
                {/*                        WebkitBackgroundClip: 'text',*/}
                {/*                        backgroundClip: 'text'*/}
                {/*                    },*/}
                {/*                    '& .text': {*/}
                {/*                        background: 'linear-gradient(45deg, #F57F17, #FBC02D)',*/}
                {/*                        WebkitBackgroundClip: 'text',*/}
                {/*                        WebkitTextFillColor: 'transparent',*/}
                {/*                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'*/}
                {/*                    }*/}
                {/*                }}*/}
                {/*            >*/}
                {/*                <span className="emoji">📋</span>*/}
                {/*                <span className="text"> Activity History</span>*/}
                {/*            </Typography>*/}

                {/*            */}{/* Activity History */}
                {/*            <Grid size={{ xs: 12, md: 12 }} sx={{ height: 'calc(100%-11px)', p: 0.5 }}>*/}

                {/*                {filteredData.statements.length > 0 && courseData && selectedLearnerId && (*/}
                {/*                    <Grid size={{ xs: 12 }} sx={{ height: '100%' }}>*/}

                {/*                        <ActivityHistory*/}
                {/*                            learner={learnerProfiles.find(l => l.id === selectedLearnerId)!}*/}
                {/*                            statements={filteredData.statements}*/}
                {/*                            courseData={courseData}*/}
                {/*                        />*/}
                {/*                    </Grid>*/}
                {/*                )}*/}
                {/*            </Grid>*/}

                {/*        </CardContent>*/}
                {/*    </Card>*/}

                {/*</Box>*/}
            </Box>
        </Box>
    );
};

export default ContentCreatorsDashboard;