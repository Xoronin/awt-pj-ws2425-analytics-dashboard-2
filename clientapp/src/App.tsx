import { useState, useEffect } from 'react';
import XAPIGenerator from './data/xapi-generator';
import { Button, Card, CardContent, CardHeader, Typography, Box, LinearProgress, Alert } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import LearnerService from './services/learner-service';
import LearnerGenerator from './data/learner-generator';
import LearnerDistribution from './components/learner-distribution';
import VerbService from './services/verb-service';
import { Verb, LearnerProfile, XAPIStatement, LearningSession, CourseData } from './types/types';
import { XAPIService } from './services/xapi-service';
import XAPIStatistics from './components/xapi-statistics';
import CourseDataGenerator from './data/course-data-generator';



const App = () => {
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

    const learnerService = new LearnerService();
    const learnerGenerator = new LearnerGenerator();
    const verbService = new VerbService();
    const xApiService = new XAPIService();
    const courseDataGenerator = new CourseDataGenerator();

    useEffect(() => {
        checkService();
    }, []);

    const checkService = async () => {
        try {
            const isAvailable = await await xApiService.getStatements().then(() => true).catch(() => false);
            setServiceAvailable(isAvailable);
            setStatus(isAvailable ? 'Service connected' : 'Service unavailable');
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

            // Get the course data
            const courseData = await courseDataGenerator.loadCourseData();
            setCourseData(courseData);


            // Get the learners
            const learners = await learnerService.getLearnerProfiles();
            setLearnerProfiles(learners);

            // Get the verbs
            const verbs = await verbService.getVerbs();
            setVerbs(verbs);

            // Generate xAPI data
            const xApiGenerator = new XAPIGenerator(courseData, verbs, learners);

            const result = await xApiGenerator.generateAndSaveStatements(50, 12, (progress) => {
                setProgress(progress);
                setStatus(`Generating and saving data: ${progress}%`);
            });

            // Set the sessions and statements
            setSessions(result.sessions);
            setStatements(result.statements);

            //// Get xApi statements
            //const statements = await xApiService.getStatements();
            //setStatements(statements);

            //await learnerGenerator.getDistributionInfo(learners);

           setStatus('Data generation complete');
        } catch (error) {
            setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setStatus('Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, margin: 'auto', p: 2 }}>
            <Card>
                <CardHeader
                    title="xAPI Statements Generator"
                    sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
                />
                <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Status Indicator */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircleIcon
                                sx={{
                                    fontSize: 12,
                                    color: serviceAvailable ? 'success.main' : 'error.main'
                                }}
                            />
                            <Typography variant="body2">{status}</Typography>
                        </Box>

                        {/* Generate Button */}
                        <Button
                            variant="contained"
                            onClick={generateData}
                            disabled={generating || !serviceAvailable}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            {generating ? 'Generating...' : 'Generate xAPI Data'}
                        </Button>

                        {/* Progress Indicator */}
                        {generating && (
                            <Box sx={{ width: '100%' }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{ mb: 1 }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    Progress: {progress}%
                                </Typography>
                            </Box>
                        )}

                        {/* Error Message */}
                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {learnerProfiles.length > 0 && (
                <LearnerDistribution learnerProfiles={learnerProfiles} />
            )}

            {sessions.size > 0 && statements.length > 0 && verbs.length > 0 && courseData && (
                <XAPIStatistics
                    sessions={sessions}
                    statements={statements}
                    verbs={verbs}
                    courseData={courseData}
                />
            )}
        </Box>
    );
};

export default App;