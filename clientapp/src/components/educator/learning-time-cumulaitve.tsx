import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from "recharts";
import { XAPIStatement, LearnerProfile } from '../../types/types';
import { Box, Typography, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText } from '@mui/material';

/**
 * Props interface for the LineTimeChartCumulative component
 * @interface LineTimeChartCumulativeProps
 * @property {XAPIStatement[]} statements - Array of xAPI statements containing learning activity data
 * @property {LearnerProfile[]} learnerProfiles - Array of learner profile objects with email identifiers
*/
interface LineTimeChartCumulativeProps {
    statements: XAPIStatement[];
    learnerProfiles: LearnerProfile[];
}

/**
 * Interface representing a single learner's data item for a specific date
 * @interface LearnerDataItem
 * @property {string} email - Learner's email address used as unique identifier
 * @property {string} displayName - Learner's display name (derived from email)
 * @property {number} value - Cumulative learning time value in minutes
 * @property {string} color - Color code for visual representation in the chart
*/
interface LearnerDataItem {
    email: string;
    displayName: string;
    value: number;
    color: string;
}

/**
 * Component that displays a cumulative line chart of learning time across multiple learners
 * 
 * @component
 * @param {LineTimeChartCumulativeProps} props - Component props
 * @returns {React.ReactElement} The rendered component
*/
const LineTimeChartCumulative = ({ statements, learnerProfiles }: LineTimeChartCumulativeProps) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [selectedDateData, setSelectedDateData] = useState<LearnerDataItem[]>([]);

    /**
     * Parses an ISO 8601 duration string and converts it to minutes
     * 
     * @param {string} duration - ISO 8601 duration string (e.g., "PT1H30M15S")
     * @returns {number} Total duration in minutes
    */
    const parseDuration = (duration: string): number => {
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 0;
        const [, hours, minutes, seconds] = matches;
        return (
            (parseInt(hours || "0") * 60) +
            parseInt(minutes || "0") +
            Math.ceil(parseInt(seconds || "0") / 60)
        );
    };

    // Color palette for learner lines in the chart
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const colors = [
        '#1565C0',  // Blue
        '#D32F2F',  // Red
        '#388E3C',  // Green
        '#FFA000',  // Amber
        '#7B1FA2',  // Purple
        '#00796B',  // Teal
        '#F57C00',  // Orange
        '#5D4037',  // Brown
        '#C2185B',  // Pink
        '#303F9F',  // Indigo
        '#0097A7',  // Cyan
        '#689F38',  // Light Green
        '#616161',  // Grey
        '#E64A19',  // Deep Orange
        '#512DA8',  // Deep Purple
        '#00ACC1',  // Light Blue
        '#FF7043',  // Lighter Orange
        '#673AB7',  // Violet
        '#2E7D32',  // Darker Green
        '#01579B',  // Darker Blue
    ];

    /**
     * Creates a mapping of learner emails to consistent colors
     * 
     * @returns {Record<string, string>} Map of email addresses to color codes
    */
    const emailToColorMap = useMemo(() => {
        const map: Record<string, string> = {};
        learnerProfiles.forEach((learner, index) => {
            map[learner.email] = colors[index % colors.length];
        });
        return map;
    }, [learnerProfiles, colors]);

    /**
     * Creates a mapping of learner emails to display names
     * Extracts username part from email address as display name
     * 
     * @returns {Record<string, string>} Map of email addresses to display names
    */
    const emailToNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        learnerProfiles.forEach((learner) => {
            // Use email username part since name isn't available
            map[learner.email] = learner.email.split('@')[0];
        });
        return map;
    }, [learnerProfiles]);

    /**
     * Processes xAPI statements to calculate cumulative learning time per learner over time
     * 
     * @returns {Record<string, any>[]} Array of data points for the chart, with cumulative times for each learner
    */
    const data = useMemo(() => {
        const learnerData: Record<string, { date: string; time: number }[]> = {};
        learnerProfiles.forEach((learner) => {
            learnerData[learner.email] = [];
        });

        const sortedStatements = [...statements].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const cumulativeTime: Record<string, number> = {};

        sortedStatements.forEach((statement) => {
            const learnerEmail = statement.actor.mbox;
            if (!learnerData[learnerEmail]) return;

            const duration = statement.result?.duration ? parseDuration(statement.result.duration) : 0;
            cumulativeTime[learnerEmail] = (cumulativeTime[learnerEmail] || 0) + duration;

            learnerData[learnerEmail].push({
                date: new Date(statement.timestamp).toISOString().split("T")[0],
                time: cumulativeTime[learnerEmail],
            });
        });

        const mergedData: Record<string, any>[] = [];
        const allDates = Array.from(new Set(sortedStatements.map(s =>
            new Date(s.timestamp).toISOString().split("T")[0]
        )));

        allDates.forEach(date => {
            const entry: Record<string, any> = { name: date };
            learnerProfiles.forEach(learner => {
                const lastEntry = learnerData[learner.email].filter(e => e.date <= date).pop();
                entry[learner.email] = lastEntry ? lastEntry.time : 0;
            });
            mergedData.push(entry);
        });

        return mergedData;
    }, [statements, learnerProfiles]);

    /**
     * Handles chart click events and opens dialog with details for the selected date
     * 
     * @param {any} data - Click event data from the Recharts component
    */
    const handleChartClick = (data: any) => {
        if (data && data.activeLabel) {
            const date = data.activeLabel;
            const dateData: LearnerDataItem[] = [];

            if (data.activePayload) {
                data.activePayload.forEach((item: any) => {
                    if (item.value > 0) {
                        dateData.push({
                            email: item.dataKey,
                            displayName: emailToNameMap[item.dataKey] || item.dataKey,
                            value: item.value,
                            color: emailToColorMap[item.dataKey] || '#1565C0'
                        });
                    }
                });
            }

            // Sort by value in descending order
            dateData.sort((a, b) => b.value - a.value);

            setSelectedDate(date);
            setSelectedDateData(dateData);
            setDialogOpen(true);
        }
    };

    /**
     * Closes the details dialog
    */
    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    /**
     * Formats a date string for display in the German locale format
     * 
     * @param {string} dateStr - ISO date string
     * @returns {string} Formatted date string
     */
    const formatDate = (dateStr: string): string => {
        return new Date(dateStr).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Typography
                sx={{
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#1565C0',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    mb: 1
                }}
            >
                Cumulative Learning Time (Click on a date point to see details)
            </Typography>

            <Box sx={{
                flex: 1,
                minHeight: 0,
                width: '100%',
                pb: 1
            }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 30
                        }}
                        onClick={handleChartClick}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#90CAF9" />
                        <XAxis
                            dataKey="name"
                            label={{
                                value: 'Dates',
                                position: 'insideBottom',
                                style: { fontSize: '0.8em' },
                                offset: -15
                            }}
                            tick={{ fontSize: '0.75em' }}
                            height={40}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        />
                        <YAxis
                            label={{
                                value: "Minutes",
                                angle: -90,
                                position: 'insideLeft',
                                style: { fontSize: '0.8em' },
                                offset: 10,
                                dy: 20,
                            }}
                            tick={{ fontSize: '0.75em' }}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const learnersWithData = payload.filter(p => (p.value ?? 0) > 0).length;

                                    return (
                                        <div style={{
                                            backgroundColor: '#E3F2FD',
                                            border: '1px solid #1565C0',
                                            borderRadius: '4px',
                                            padding: '8px 12px',
                                            fontSize: '0.85rem'
                                        }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                {new Date(label).toLocaleDateString('de-DE', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div>
                                                Click to show all {learnersWithData} learners for this date
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        {selectedDate && (
                            <ReferenceLine
                                x={selectedDate}
                                stroke="#FF5722"
                                strokeWidth={2}
                                strokeDasharray="3 3"
                            />
                        )}
                        {learnerProfiles.map((learner) => (
                            <Line
                                key={learner.email}
                                type="monotone"
                                dataKey={learner.email}
                                stroke={emailToColorMap[learner.email]}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Box>

            {/* Dialog to display all learners for a selected date */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        maxHeight: '80vh'
                    }
                }}
            >
                <DialogTitle sx={{ bgcolor: '#1565C0', color: 'white' }}>
                    Learning Time for {selectedDate ? formatDate(selectedDate) : ""}
                </DialogTitle>
                <DialogContent dividers>
                    <List sx={{ width: '100%' }}>
                        {selectedDateData.map((item, index) => (
                            <ListItem
                                key={item.email}
                                divider={index < selectedDateData.length - 1}
                                sx={{
                                    '&:hover': {
                                        bgcolor: '#E3F2FD'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    backgroundColor: item.color,
                                                    marginRight: 1.5,
                                                    borderRadius: '50%',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <Typography sx={{ fontWeight: 500 }}>
                                                {item.displayName}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={`${item.value} minutes`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default LineTimeChartCumulative;