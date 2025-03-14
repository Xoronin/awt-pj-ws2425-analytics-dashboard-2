import React, { useEffect, useRef } from 'react';
import { Chart, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';
import { XAPIStatement } from '../../types/types';
import { Box, Typography } from '@mui/material';

// Register the required Chart.js components for boxplot visualization
Chart.register(BoxPlotController, BoxAndWiskers, LinearScale, CategoryScale, Title, Tooltip, Legend);

/**
 * Props interface for the CourseBoxplot component
 * @interface CourseBoxplotProps
 * @property {XAPIStatement[]} statements - Array of xAPI statements containing scoring data
*/
interface CourseBoxplotProps {
    statements: XAPIStatement[];
}

/**
 * Component that creates a boxplot visualization of score distributions across different courses
 * 
 * This component analyzes xAPI statements to extract course scores and visualize their statistical
 * distribution (min, max, median, quartiles, outliers) using boxplots. Each boxplot represents
 * the distribution of scores for a specific course module.
 * 
 * @component
 * @param {CourseBoxplotProps} props - Component props
 * @returns {React.ReactElement} The rendered component
*/
const CourseBoxplot: React.FC<CourseBoxplotProps> = ({ statements }) => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    /**
     * Effect hook to create and update the boxplot chart
     * 
     * This effect:
     * 1. Extracts scores from xAPI statements for each course
     * 2. Processes the data into a format required by the boxplot chart
     * 3. Creates or updates the Chart.js instance
     * 4. Handles cleanup when component unmounts
    */
    useEffect(() => {
        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        // Step 1: Extract scores for each unique course (activityId)
        const courseScores: Record<string, number[]> = {};

        statements
            .filter(
                (statement) =>
                    statement.verb.id === 'http://adlnet.gov/expapi/verbs/scored' && statement.result?.score?.raw !== undefined
            )
            .forEach((statement) => {
                const activityId =
                    statement.object.definition.extensions?.[
                    'https://w3id.org/learning-analytics/learning-management-system/external-id'
                    ];

                if (activityId) {
                    if (!courseScores[activityId]) {
                        courseScores[activityId] = [];
                    }
                    courseScores[activityId].push(statement.result!.score!.raw!);
                }
            });

        // Step 2: Prepare labels and data for the chart
        const labels = Object.keys(courseScores);
        const data = labels.map((activityId) => courseScores[activityId]);

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        // Step 3: Create the boxplot chart
        chartInstanceRef.current = new Chart(ctx, {
            type: 'boxplot',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Scores by Course',
                        data,
                        backgroundColor: 'rgba(46, 125, 50, 0.2)',
                        borderColor: 'rgba(46, 125, 50, 0.8)',
                        borderWidth: 2,
                        outlierBackgroundColor: 'rgba(46, 125, 50, 0.3)',
                        outlierBorderColor: 'rgba(46, 125, 50, 0.8)',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Score',
                            font: {
                                size: 14
                            }
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Course Modules',
                            font: {
                                size: 14
                            }
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            },
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [statements]);

    return (
        <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Typography
                sx={{
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#2E7D32',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    mb: 1
                }}
            >
                Boxplot of Scores by Course
            </Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <canvas ref={chartRef} style={{ maxHeight: '100%' }} />
            </Box>
        </Box>
    );
};

export default CourseBoxplot;
