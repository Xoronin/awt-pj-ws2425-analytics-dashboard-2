import React, { useEffect, useRef } from 'react';
import { Chart, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';
import { XAPIStatement } from '../../types/types'; // Adjust the path if needed

// Register chart components
Chart.register(BoxPlotController, BoxAndWiskers, LinearScale, CategoryScale, Title, Tooltip, Legend);

interface CourseBoxplotProps {
  statements: XAPIStatement[];
}

const CourseBoxplot: React.FC<CourseBoxplotProps> = ({ statements }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

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
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Boxplot of Scores by Course',
          },
          legend: {
            position: 'top',
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [statements]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default CourseBoxplot;
