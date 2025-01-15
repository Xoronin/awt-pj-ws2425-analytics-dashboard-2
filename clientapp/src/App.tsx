import { useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Card,
    CardContent,
    CardHeader,
    Button,
    LinearProgress,
    Alert,
    Container,
    Paper,
    useTheme
} from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LearnerDashboard from './components/learner-dashboard';
import EducatorDashboard from './components/educator-dashboard';
import ContentCreatorDashboard from './components/content-creator-dashboard';
import { Verb, LearnerProfile, XAPIStatement, LearningSession, CourseData } from './types/types';
import { XAPIService } from './services/xapi-service';
import LearnerService from './services/learner-service';
import VerbService from './services/verb-service';
import CourseDataGenerator from './data/course-data-generator';
import XAPIGenerator from './data/xapi-generator';
import LearnerGenerator from './data/learner-generator';
import XAPIStatistics from './components/xapi-statistics';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`role-tabpanel-${index}`}
            aria-labelledby={`role-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const App = () => {
    const theme = useTheme();
    const [currentTab, setCurrentTab] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [serviceAvailable, setServiceAvailable] = useState<boolean>(false);
    const [learnerProfiles, setLearnerProfiles] = useState<LearnerProfile[]>([]);
    const [sessions, setSessions] = useState<Map<string, LearningSession[]>>(new Map());
    const [statements, setStatements] = useState<XAPIStatement[]>([]);
    const [verbs, setVerbs] = useState<Verb[]>([]);
    const [courseData, setCourseData] = useState<CourseData | null>(null);

    const services = {
        learner: new LearnerService(),
        learnerGenerator: new LearnerGenerator(),
        verb: new VerbService(),
        xApi: new XAPIService(),
        courseData: new CourseDataGenerator(),
    };

    useEffect(() => {
        checkService();
        generateData();
    }, []);

    const checkService = async () => {
        try {
            const isAvailable = await services.xApi.getStatements().then(() => true).catch(() => false);
            setServiceAvailable(isAvailable);
            setStatus(isAvailable ? 'Generating data' : 'Data generation unavailable');
        } catch (error) {
            setServiceAvailable(false);
            setStatus('Error connecting to service');
        }
    };

    const generateData = async () => {
        try {
            setGenerating(true);
            setError('');
            setProgress(0);

            // Load course data
            const courseData = await services.courseData.loadCourseData();
            setCourseData(courseData);

            // Get learner profiles
            const learners = await services.learner.getLearnerProfiles();
            setLearnerProfiles(learners);

            // Load verbs
            const verbs = await services.verb.getVerbs();
            setVerbs(verbs);

            // Generate xAPI data
            const xApiGenerator = new XAPIGenerator(courseData, verbs, learners);
            const result = await xApiGenerator.generateAndSaveStatements(50, 12, (progress) => {
                setProgress(progress);
                setStatus(`Generating and saving data: ${progress}%`);
            });

            setSessions(result.sessions);
            setStatements(result.statements);

            //const statements = await services.xApi.getStatements();
            //setStatements(statements);

            await services.learnerGenerator.getDistributionInfo(learners);

            setStatus('Data generation complete');
        } catch (error) {
            setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setStatus('Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DashboardIcon sx={{ fontSize: 32 }} />
                            <Typography variant="h5" component="h1">
                                Learning Analytics Dashboard
                            </Typography>
                        </Box>
                    }
                    sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        py: 3,
                    }}
                />
                <CardContent sx={{ p: 0 }}>
                    {/* Control Panel */}
                    <Box sx={{ px: 3, py: 2, bgcolor: 'background.paper' }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2,
                            mb: 2
                        }}>
                            {/* Service Status */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircleIcon
                                    sx={{
                                        fontSize: 12,
                                        color: serviceAvailable ? 'success.main' : 'error.main'
                                    }}
                                />
                                <Typography variant="body2">{status}</Typography>
                            </Box>

                        {/*    */}{/* Generate Data Button */}
                        {/*    <Button*/}
                        {/*        variant="contained"*/}
                        {/*        onClick={generateData}*/}
                        {/*        disabled={generating || !serviceAvailable}*/}
                        {/*        startIcon={<CloudSyncIcon />}*/}
                        {/*        sx={{*/}
                        {/*            minWidth: 180,*/}
                        {/*            '&.Mui-disabled': {*/}
                        {/*                bgcolor: theme.palette.action.disabledBackground*/}
                        {/*            }*/}
                        {/*        }}*/}
                        {/*    >*/}
                        {/*        {generating ? 'Generating...' : 'Generate Data'}*/}
                        {/*    </Button>*/}
                        </Box>

                        {/* Progress and Error Indicators */}
                        {generating && (
                            <Box sx={{ width: '100%', mb: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        mb: 1,
                                        bgcolor: theme.palette.grey[200]
                                    }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    Progress: {progress}%
                                </Typography>
                            </Box>
                        )}

                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 2,
                                    '& .MuiAlert-message': {
                                        display: 'flex',
                                        alignItems: 'center'
                                    }
                                }}
                            >
                                {error}
                            </Alert>
                        )}
                    </Box>

                    {/* Role Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            sx={{
                                '& .MuiTab-root': {
                                    py: 2,
                                    fontSize: '1rem',
                                }
                            }}
                        >
                            <Tab label="Data Statistics" />
                            <Tab label="Learner Dashboard" />
                            <Tab label="Educator Dashboard" />
                            <Tab label="Content Creator Dashboard" />
                        </Tabs>
                    </Box>

                    {/* Dashboard Content */}
                    <Box sx={{ px: 2 }}>
                        <TabPanel value={currentTab} index={0}>
                            {sessions.size > 0 && statements.length > 0 && verbs.length > 0 && courseData && learnerProfiles.length > 0 && (
                                <XAPIStatistics
                                    learnerProfiles={learnerProfiles}
                                    sessions={sessions}
                                    statements={statements}
                                    verbs={verbs}
                                    courseData={courseData}
                                />
                            )}
                        </TabPanel>
                        <TabPanel value={currentTab} index={1}>
                            <LearnerDashboard
                                learnerProfiles={learnerProfiles}
                                sessions={sessions}
                                statements={statements}
                                verbs={verbs}
                                courseData={courseData}
                            />
                        </TabPanel>
                        <TabPanel value={currentTab} index={2}>
                            <EducatorDashboard
                                learnerProfiles={learnerProfiles}
                                sessions={sessions}
                                statements={statements}
                                verbs={verbs}
                                courseData={courseData}
                            />
                        </TabPanel>
                        <TabPanel value={currentTab} index={3}>
                            <ContentCreatorDashboard
                                learnerProfiles={learnerProfiles}
                                sessions={sessions}
                                statements={statements}
                                verbs={verbs}
                                courseData={courseData}
                            />
                        </TabPanel>
                    </Box>
                </CardContent>
            </Paper>
        </Container>
    );
};

export default App;