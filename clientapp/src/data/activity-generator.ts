﻿import { Verb } from '../services/verb-service';
import { Activity, CourseStructure } from './course-data-generator';
import { LearnerProfile } from './learner-generator';
import { SessionActivity } from './session-generator';

export interface LearningEvent {
    verb: Verb;
    timestamp: Date;
    result?: {
        score?: {
            raw?: number;
            min?: number;
            max?: number;
            scaled?: number;
        };
        success?: boolean;
        completion?: boolean;
        duration?: string;
        progress?: number;
    };
}

interface ActivityProgress {
    currentProgress: number;
    attempts: number;
    lastVerb?: string;
    initialized: boolean;
    completed: boolean;
}

enum EventType {
    INITIALIZED = 'initialized',
    LAUNCHED = 'launched',
    PROGRESSED = 'progressed',
    SCORED = 'scored',
    PASSED = 'passed',
    FAILED = 'failed',
    COMPLETED = 'completed',
    RATED = 'rated',
    EXITED = 'exited'
}

interface ActivityConfig {
    maxAttempts: number;
    passingScore: number;
    progressThreshold: number;
    minSessionTime: number;
    baseActivityDuration: number;
}

// Configuration
const CONFIG: ActivityConfig = {
    maxAttempts: 3,
    passingScore: 50,
    progressThreshold: 0.8,
    minSessionTime: 15,
    baseActivityDuration: 60
};

/**
 * ActivityGenerator manages the learning activity lifecycle including:
 * - Activity selection and progression
 * - Progress tracking and scoring
 * - Learning event generation
 * - Session time management
 * 
 * Core responsibilities:
 * 1. Selects appropriate activities based on learner progress
 * 2. Tracks progress through activities
 * 3. Generates standardized learning events
 * 4. Manages completion and scoring logic
 */
class ActivityGenerator {
    private readonly config: ActivityConfig;
    private currentActivities: Map<string, string> = new Map();
    private activityProgress: Map<string, Map<string, ActivityProgress>> = new Map();
    private courseData: CourseStructure;
    private verbs: Verb[];
    private numberOfWeeks: number;

    constructor(courseData: CourseStructure, verbs: Verb[], numberOfWeeks: number, config: ActivityConfig = CONFIG,) {
        this.courseData = courseData;
        this.verbs = verbs;
        this.numberOfWeeks = numberOfWeeks;
        this.config = config;
    }

    /**
     * Selects and processes activities for a learning session.
     * 
     * Flow:
     * 1. Get/select activity
     * 2. Calculate duration based on learner speed
     * 3. Update progress
     * 4. Generate events
     * 5. Move to next activity if completed
     * 
     * @param profile - Learner profile containing metrics and preferences
     * @param sessionDuration - Total available time in minutes
     * @param startTime - Session start timestamp
     * @param currentWeek - Current week number (affects phase-based metrics)
     * @returns Array of processed activities with events
     */
    public selectActivities(
        profile: LearnerProfile,
        sessionDuration: number,
        startTime: Date,
        currentWeek: number
    ): SessionActivity[] {
        const activities: SessionActivity[] = [];
        let remainingTime = sessionDuration;
        let currentTime = new Date(startTime);

        // Get current activity or select a new one
        let currentActivity = this.getCurrentOrSelectActivity(profile);

        while (currentActivity && remainingTime >= this.config.minSessionTime) {
            const progress = this.getActivityProgress(profile.id, currentActivity.id);
            const learningSpeedMultiplier = this.getMetricValue(profile, 'duration', currentWeek);

            // Calculate time needed for this activity
            const adjustedDuration = Math.round(
                currentActivity.estimatedDuration * (1 / learningSpeedMultiplier)
            );
            const activityDuration = Math.min(adjustedDuration, remainingTime);

            if (activityDuration < this.config.minSessionTime) {
                break; // Not enough time for meaningful progress
            }

            // Update progress
            this.updateProgress(
                progress,
                activityDuration,
                adjustedDuration,
                learningSpeedMultiplier
            );

            // Check if ready for scoring
            const willScore = progress.currentProgress >= this.config.progressThreshold;

            let completed = false;
            let score = 0;

            if (willScore) {
                progress.attempts++;
                score = this.calculateScore(profile, currentActivity, currentWeek);
                completed = score >= this.config.passingScore || progress.attempts >= this.config.maxAttempts;
            }

            const endTime = new Date(currentTime.getTime() + activityDuration * 60000);

            // Create session activity
            activities.push({
                activity: currentActivity,
                startTime: new Date(currentTime),
                endTime: endTime,
                duration: activityDuration,
                completed,
                events: this.generateEvents(
                    currentTime,
                    activityDuration,
                    completed,
                    score,
                    progress,
                    willScore
                )
            });

            // Update remaining time and current time
            remainingTime -= activityDuration;
            currentTime = endTime;

            // Only get next activity if current one is completed AND there's enough time left
            if (completed) {
                this.currentActivities.delete(profile.id);
                // Get next activity immediately if there's enough time
                if (remainingTime >= this.config.minSessionTime) {
                    currentActivity = this.getCurrentOrSelectActivity(profile);
                    // If we got a new activity, continue the loop
                    if (!currentActivity) break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        return activities;
    }

    /**
     * Retrieves current activity or selects a new random one.
     * Maintains activity continuity across sessions until completion/max attempts.
     * 
     * @param profile - Learner profile for activity tracking
     * @returns Current or new activity, undefined if no eligible activities
     */
    private getCurrentOrSelectActivity(profile: LearnerProfile): Activity | undefined {
        const currentActivityId = this.currentActivities.get(profile.id);
        const availableActivities = [...this.courseData.sections.flatMap(s => s.activities)];

        if (currentActivityId) {
            return availableActivities.find(a => a.id === currentActivityId);
        }

        const eligibleActivities = availableActivities.filter(activity => {
            const progress = this.getActivityProgress(profile.id, activity.id);
            return !progress.completed && progress.attempts < this.config.maxAttempts;
        });

        if (eligibleActivities.length === 0) return undefined;

        const randomActivity = eligibleActivities[Math.floor(Math.random() * eligibleActivities.length)];
        this.currentActivities.set(profile.id, randomActivity.id);
        return randomActivity;
    }

    /**
     * Gets or initializes progress tracking for an activity.
     * Creates new progress record if none exists.
     * 
     * @param learnerId - Unique learner identifier
     * @param activityId - Activity being tracked
     * @returns Progress tracking object
     */
    private getActivityProgress(learnerId: string, activityId: string): ActivityProgress {
        if (!this.activityProgress.has(learnerId)) {
            this.activityProgress.set(learnerId, new Map());
        }

        const learnerProgress = this.activityProgress.get(learnerId)!;
        if (!learnerProgress.has(activityId)) {
            learnerProgress.set(activityId, {
                currentProgress: 0,
                attempts: 0,
                completed: false,
                lastVerb: '',
                initialized: false
            });
        }

        return learnerProgress.get(activityId)!;
    }

    /**
     * Generates standardized learning events for an activity session.
     * Events follow xAPI verb patterns: initialized → launched → progressed → 
     * [scored → passed/failed → completed → rated] or exited
     * 
     * @param startTime - Event sequence start time
     * @param duration - Activity duration in minutes
     * @param completed - Whether activity was completed
     * @param score - Activity score (if scored)
     * @param progress - Current progress state
     * @param willScore - Whether scoring will occur
     * @returns Ordered array of learning events
     */
    private generateEvents(
        startTime: Date,
        duration: number,
        completed: boolean,
        score: number,
        progress: ActivityProgress,
        willScore: boolean
    ): LearningEvent[] {
        const events: LearningEvent[] = [];
        let currentTime = new Date(startTime.getTime());
        const activityDuration = duration * 60000;
        const timeStep = Math.floor(activityDuration / 8);

        const getVerb = (verbName: string): Verb => {
            const verb = this.verbs.find(v => v.prefLabel === verbName);
            if (!verb) {
                return {
                    id: `http://adlnet.gov/expapi/verbs/${verbName}`,
                    type: 'Verb',
                    prefLabel: verbName,
                    definition: `Default definition for ${verbName}`
                };
            }
            return verb;
        };

        try {
            // Initialize on first attempt
            if (progress.attempts === 1 && !progress.initialized) {
                events.push({
                    verb: getVerb(EventType.INITIALIZED),
                    timestamp: new Date(currentTime),
                    result: {
                        success: true,
                        completion: false,
                        progress: 0
                    }
                });
                progress.initialized = true;
                currentTime = new Date(currentTime.getTime() + timeStep);
            }

            // Always start with launched for each session
            events.push({
                verb: getVerb(EventType.LAUNCHED),
                timestamp: new Date(currentTime),
                result: undefined
            });
            currentTime = new Date(currentTime.getTime() + timeStep);

            // Add progress event
            if (duration > 5) {
                events.push({
                    verb: getVerb(EventType.PROGRESSED),
                    timestamp: new Date(currentTime),
                    result: {
                        progress: progress.currentProgress
                    }
                });
                currentTime = new Date(currentTime.getTime() + timeStep);
            }

            let lastVerb = EventType.PROGRESSED;

            // Scoring and completion logic
            if (willScore) {
                events.push({
                    verb: getVerb(EventType.SCORED),
                    timestamp: new Date(currentTime),
                    result: {
                        score: {
                            raw: score,
                            min: 0,
                            max: 100,
                            scaled: score / 100
                        }
                    }
                });
                lastVerb = EventType.SCORED;
                currentTime = new Date(currentTime.getTime() + timeStep);

                if (score >= this.config.passingScore) {
                    events.push({
                        verb: getVerb(EventType.PASSED),
                        timestamp: new Date(currentTime),
                        result: {
                            score: {
                                raw: score,
                                min: 0,
                                max: 100,
                                scaled: score / 100
                            },
                            success: true
                        }
                    });
                    lastVerb = EventType.PASSED;

                    if (completed) {
                        events.push({
                            verb: getVerb(EventType.COMPLETED),
                            timestamp: new Date(currentTime),
                            result: {
                                completion: true,
                                success: true
                            }
                        });
                        lastVerb = EventType.COMPLETED;
                        currentTime = new Date(currentTime.getTime() + timeStep);

                        // Add rated after completion
                        events.push({
                            verb: getVerb(EventType.RATED),
                            timestamp: new Date(currentTime),
                            result: {
                                score: {
                                    raw: score,
                                    min: 0,
                                    max: 100,
                                    scaled: score / 100
                                }
                            }
                        });
                        lastVerb = EventType.RATED;
                    }
                } else {
                    events.push({
                        verb: getVerb(EventType.FAILED),
                        timestamp: new Date(currentTime),
                        result: {
                            score: {
                                raw: score,
                                min: 0,
                                max: 100,
                                scaled: score / 100
                            },
                            success: false
                        }
                    });
                    lastVerb = EventType.FAILED;
                }
            }

            // Exit if not completed/rated
            if (lastVerb !== EventType.RATED) {
                events.push({
                    verb: getVerb(EventType.EXITED),
                    timestamp: new Date(currentTime),
                    result: undefined
                });
                lastVerb = EventType.EXITED;
            }

            progress.lastVerb = lastVerb;
            return events;

        } catch (error) {
            console.error('Error generating events:', error);
            return [{
                verb: getVerb(EventType.INITIALIZED),
                timestamp: startTime,
                result: undefined
            }];
        }
    }

    /**
     * Updates activity progress based on time spent and learner speed.
     * Progress is calculated as: (timeSpent / neededTime) * learningSpeed
     * 
     * @param progress - Progress tracking object
     * @param timeSpent - Actual time spent in minutes
     * @param neededTime - Expected time needed in minutes
     * @param learningSpeed - Learner's speed multiplier
     */
    private updateProgress(
        progress: ActivityProgress,
        timeSpent: number,
        neededTime: number,
        learningSpeed: number
    ): void {
        // Calculate progress increment based on:
        // 1. Time spent vs needed time ratio
        // 2. Learning speed multiplier
        // 3. Cannot exceed remaining progress needed
        const progressIncrement = Math.min(
            1 - progress.currentProgress,
            (timeSpent / neededTime) * learningSpeed
        );

        // Update progress (rounded to 3 decimal places for precision)
        progress.currentProgress = Math.round(
            (progress.currentProgress + progressIncrement) * 1000
        ) / 1000;
    }

    /**
     * Calculates activity score based on:
     * - Base score (learner's score metric * 100)
     * - Difficulty adjustment ((1 - difficulty) * 20)
     * - Attempt bonus ((attempts - 1) * 15)
     * - Random variation based on consistency
     * 
     * @returns Score between 0-100
     */
    private calculateScore(
        profile: LearnerProfile,
        activity: Activity,
        currentWeek: number,
    ): number {
        const progress = this.getActivityProgress(profile.id, activity.id);
        const baseScore = this.getMetricValue(profile, 'scores', currentWeek) * 100;
        const difficultyImpact = (1 - activity.difficulty) * 20;
        const attemptBonus = (progress.attempts - 1) * 15;
        const consistency = this.getMetricValue(profile, 'consistency', currentWeek);
        const variation = Math.floor(Math.random() * ((1 - consistency) * 20)) - ((1 - consistency) * 10);

        return Math.round(Math.min(100, Math.max(0, baseScore + difficultyImpact + attemptBonus + variation)));
    }

    /**
     * Gets metric value (consistency, scores, duration, effort) for a learner.
     * Returns fixed value for regular personas or phase-based value for outliers.
     * 
     * @returns Metric value between 0-1
     */
    public getMetricValue(
        profile: LearnerProfile,
        metricName: 'consistency' | 'scores' | 'duration' | 'effort',
        currentWeek: number
    ): number {
        const metric = profile.metrics[metricName];

        if (typeof metric === 'number') {
            return metric; // Regular persona
        } else {
            // Outlier - get value based on current phase
            const phase = this.getCurrentPhase(currentWeek);
            return metric[phase];
        }
    }

    /**
     * Gets learning phase based on week number:
     * start (0-33%), middle (34-66%), end (67-100%)
     */
    private getCurrentPhase(currentWeek: number): 'start' | 'middle' | 'end' {
        const position = currentWeek / this.numberOfWeeks;
        if (position < 0.33) return 'start';
        if (position < 0.67) return 'middle';
        return 'end';
    }
}

export default ActivityGenerator;
