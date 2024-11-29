import React from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Divider } from '@mui/material';
import { LearnerProfile } from '../types/types';

interface DistributionProps {
    learnerProfiles: LearnerProfile[];
}

const PERSONA_ORDER = [
    'struggler',
    'average',
    'sprinter',
    'gritty',
    'coaster',
    'outlierA',
    'outlierB',
    'outlierC',
    'outlierD'
];

const getColorForPersonaType = (type: string): string => {
    const colors = {
        struggler: '#FF6B6B',
        average: '#4ECDC4',
        sprinter: '#45B7D1',
        gritty: '#96CEB4',
        coaster: '#FFEEAD',
        outlierA: '#D4A5A5',
        outlierB: '#9099A2',
        outlierC: '#A5D6A7',
        outlierD: '#B39DDB'
    };
    return colors[type as keyof typeof colors] || '#808080';
};

const LearnerDistribution = ({ learnerProfiles }: DistributionProps) => {
    const calculateDistribution = () => {
        const distribution: { [key: string]: { count: number; percentage: string } } = {};
        const total = learnerProfiles.length;

        // Initialize all possible persona types with zero counts
        PERSONA_ORDER.forEach(type => {
            distribution[type] = { count: 0, percentage: '0%' };
        });

        // Count occurrences
        learnerProfiles.forEach(profile => {
            if (!distribution[profile.personaType]) {
                distribution[profile.personaType] = { count: 0, percentage: '0%' };
            }
            distribution[profile.personaType].count++;
        });

        // Calculate percentages
        Object.keys(distribution).forEach(type => {
            distribution[type].percentage =
                `${((distribution[type].count / total) * 100).toFixed(1)}%`;
        });

        return distribution;
    };

    const distribution = calculateDistribution();

    return (
        <Card sx={{ mt: 2, mb: 2 }}>
            <CardHeader
                title="Learner Profiles Distribution"
                sx={{
                    bgcolor: 'grey.100',
                    borderBottom: 1,
                    borderColor: 'grey.300'
                }}
            />
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                        Total Learners
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 500 }}>
                        {learnerProfiles.length}
                    </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(distribution).map(([type, data]) => (
                        <Box key={type} sx={{ width: '100%' }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: getColorForPersonaType(type)
                                        }}
                                    />
                                    <Typography sx={{
                                        textTransform: 'capitalize',
                                        fontWeight: 500
                                    }}>
                                        {type.replace(/([A-Z])/g, ' $1').trim()}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {data.count} ({data.percentage})
                                </Typography>
                            </Box>
                            <Box sx={{
                                width: '100%',
                                bgcolor: 'grey.200',
                                borderRadius: 1,
                                height: 8,
                                overflow: 'hidden'
                            }}>
                                <Box sx={{
                                    width: data.percentage,
                                    bgcolor: getColorForPersonaType(type),
                                    height: '100%',
                                    transition: 'width 0.5s ease-in-out'
                                }} />
                            </Box>
                        </Box>
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
};

export default LearnerDistribution;