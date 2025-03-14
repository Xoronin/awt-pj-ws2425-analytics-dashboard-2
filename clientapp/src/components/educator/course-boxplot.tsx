import React, { useEffect, useRef } from 'react';
import { Chart, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';
import { XAPIStatement } from '../../types/types';
import { Box, Typography } from '@mui/material';

// Register the required Chart.js components for boxplot visualization
Chart.register(BoxPlotController, BoxAndWiskers, LinearScale, CategoryScale, Title, Tooltip, Legend);

interface CourseData {
    sections: {
        activities: {
            id: string;
            title: string;
            [key: string]: any;
        }[];
    }[];
}

/**
 * Props interface for the CourseBoxplot component
 * @interface CourseBoxplotProps
 * @property {XAPIStatement[]} statements - Array of xAPI statements containing scoring data
*/
interface CourseBoxplotProps {
    statements: XAPIStatement[];
    courseData: CourseData;
    maxLabelLength?: number;
    useLineBreaks?: boolean; 
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
const CourseBoxplot: React.FC<CourseBoxplotProps> = ({
    statements,
    courseData,
    maxLabelLength = 20, 
    useLineBreaks = false 
}) => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    const getActivityField = (activityId: string | undefined, field: string) => {
        if (activityId && courseData.sections) {
            const section = courseData.sections.find((s) =>
                s.activities.some((a) => a.id === activityId)
            );

            if (section) {
                const activity = section.activities.find((a) => a.id === activityId);
                const value = (activity as any)?.[field];

                return value || null;
            }
        }
        return null;
    };

    const truncateText = (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const addLineBreak = (text: string, maxLength: number): string[] => {
        if (text.length <= maxLength) return [text];

        const midPoint = Math.floor(text.length / 2);
        let breakPoint = text.indexOf(' ', midPoint - 10);

        if (breakPoint === -1 || breakPoint > midPoint + 10) {
            breakPoint = midPoint;
        }

        return [text.substring(0, breakPoint), text.substring(breakPoint).trim()];
    };


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
        const activityTitles: Record<string, string> = {};
        const fullTitles: Record<string, string> = {};
        const activityNumbers: Record<string, number> = {};

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

                        const title = getActivityField(activityId, 'title') || activityId;
                        fullTitles[activityId] = title; 

                        if (useLineBreaks) {
                            activityTitles[activityId] = title; 
                        } else {
                            activityTitles[activityId] = truncateText(title, maxLabelLength);
                        }
                    }
                    courseScores[activityId].push(statement.result!.score!.raw!);
                }
            });

        // Step 2: Prepare labels and data for the chart
        const activityIds = Object.keys(courseScores);

        activityIds.forEach((id, index) => {
            activityNumbers[id] = index + 1;
        });

        const labels = activityIds.map((_, index) => (index + 1).toString());
        const data = activityIds.map((activityId) => courseScores[activityId]);

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
                    },
                    tooltip: {
                        callbacks: {
                            title: (tooltipItems) => {
                                const index = tooltipItems[0].dataIndex;
                                const activityId = activityIds[index];
                                const activityNum = activityNumbers[activityId];

                                return `Activity ${activityNum}: ${fullTitles[activityId]}`;
                            }
                        }
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
                            text: 'Course Activities',
                            font: {
                                size: 14
                            }
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            callback: function (value, index, values) {
                                return labels[index];

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
    }, [statements, courseData, maxLabelLength, useLineBreaks]);

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
                Boxplot of Scores by Activity
            </Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <canvas ref={chartRef} style={{ maxHeight: '100%' }} />
            </Box>
        </Box>
    );
};

export default CourseBoxplot;