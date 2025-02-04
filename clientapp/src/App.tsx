import { useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    CardContent,
    CardHeader,
    Paper,
    useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LearnerDashboard from './components/learner-dashboard';
import EducatorDashboard from './components/educator-dashboard';
import ContentCreatorDashboard from './components/content-creator-dashboard';
import { Verb, LearnerProfile, XAPIStatement, CourseData } from './types/types';
import { XAPIService } from './services/xapi-service';
import LearnerService from './services/learner-service';
import VerbService from './services/verb-service';
import CourseDataGenerator from './data/course-data-generator';
import LearnerGenerator from './data/learner-generator';
import XAPIStatistics from './components/xapi-statistics';
import XAPIGenerator from './data/xapi-generator';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`role-tabpanel-${index}`}
            aria-labelledby={`role-tab-${index}`}
            style={{ height: 'calc(100vh - 120px)' }}
        >
            {value === index && (
                <Box sx={{ height: '100%' }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const App = () => {
    const theme = useTheme();
    const [currentTab, setCurrentTab] = useState(0);
    const [learnerProfiles, setLearnerProfiles] = useState<LearnerProfile[]>([]);
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
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const courseData = await services.courseData.loadCourseData();
            setCourseData(courseData);

            const learners = await services.learner.getLearnerProfiles();
            setLearnerProfiles(learners);

            const verbs = await services.verb.getVerbs();
            setVerbs(verbs);

            // Generate new xApi Statements
            //const xApiGenerator = new XAPIGenerator(courseData, verbs, learners);
            //const result = await xApiGenerator.generateAndSaveStatements(50, 12);
            //setStatements(result.statements);

            const statements = await services.xApi.getStatements();
            setStatements(statements);

            await services.learnerGenerator.getDistributionInfo(learners);

        } catch (error) {
            console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const dashboardProps = {
        learnerProfiles,
        statements,
        verbs,
        courseData
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: theme.palette.background.default
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 0  
                }}
            >
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DashboardIcon sx={{ fontSize: 32 }} />
                            <Typography variant="h5" component="h1">
                                Adaptive Learning Analytics Dashboard
                            </Typography>
                        </Box>
                    }
                    sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        py: 2,
                        borderRadius: 0 
                    }}
                />
                <CardContent
                    sx={{
                        p: 0,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        '&:last-child': { pb: 0 }
                    }}
                >
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

                    <Box sx={{
                        px: 2,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <TabPanel value={currentTab} index={0}>
                            {courseData && <XAPIStatistics {...dashboardProps} courseData={courseData} />}
                        </TabPanel>
                        <TabPanel value={currentTab} index={1}>
                            <LearnerDashboard {...dashboardProps} />
                        </TabPanel>
                        <TabPanel value={currentTab} index={2}>
                            <EducatorDashboard {...dashboardProps} />
                        </TabPanel>
                        <TabPanel value={currentTab} index={3}>
                            <ContentCreatorDashboard {...dashboardProps} />
                        </TabPanel>
                    </Box>
                </CardContent>
            </Paper>
        </Box>
    );
};

export default App;