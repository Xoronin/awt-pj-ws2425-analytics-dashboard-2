import { useState, useEffect } from 'react';
import GenerateXAPIData from './data/xapi-generator';
import { Button, Card, CardContent, CardHeader, Typography, Box, LinearProgress, Alert } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

const XAPIGenerator = () => {
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [serviceAvailable, setServiceAvailable] = useState<boolean>(false);

    const xApiGenerator = new GenerateXAPIData();

    useEffect(() => {
        checkService();
    }, []);

    const checkService = async () => {
        try {
            const isAvailable = await xApiGenerator.validateService();
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

            await xApiGenerator.generateAndSaveStatements(50, 12, (progress) => {
                setProgress(progress);
                setStatus(`Generating and saving data: ${progress}%`);
            });

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
                    title="xAPI Data Generator"
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
        </Box>
    );
};

export default XAPIGenerator;