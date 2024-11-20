import { v4 as uuidv4 } from 'uuid';
import Utility from '../helper/utility';
import { Activity, CourseStructure } from './course-data-generator';
import LearnerGenerator, { Persona, LearnerProfile } from './learner-generator';

export interface LearningSession {
    id: string;
    startTime: Date;
    endTime: Date;
    activities: PlannedActivity[];
    totalDuration: number;
    learner: Learner;
}

export interface PlannedActivity {
    id: string;
    activity: Activity;
    startTime: Date;
    duration: number;
    interactions: ActivityInteraction[];
    completed: boolean;
    score?: {
        scaled?: number;
        min?: number;
        max?: number;
        raw?: number;
    }
}

export interface ActivityInteraction {
    id: string;
    verb: string;
    timestamp: Date;
    progress?: number;
    result?: {
        score?: {
            scaled?: number;
            min?: number;
            max?: number;
            raw?: number;
        }
        completion?: boolean;
        success?: boolean;
        duration?: string;
    };
}

export interface Learner {
    id: string;
    persona: Persona;
    profile: LearnerProfile;
}

/**
 * Generates simulated learning sessions with realistic student interactions
 */
class LearningSessionGenerator {
    private utility: Utility;

    constructor() {
        this.utility = new Utility();
    }

    /**
     * Creates a complete learning session for a student
     * @param learner - Student profile and persona
     * @param courseStructure - Available course content
     * @param date - Session date
     * @returns Complete learning session with activities and interactions
     */
    generateSession(
        learner: Learner, 
        courseStructure: CourseStructure,
        date: Date
    ): LearningSession {
        // Use preferred times from learner profile
        const startTime = this.generatePreferredStartTime(date, learner.profile.preferredTimes);
        const sessionDuration = this.calculateSessionDuration(learner);
        const endTime = new Date(startTime.getTime() + sessionDuration * 60000);
        
        const activities = this.planSessionActivities(
            learner,
            courseStructure, 
            startTime, 
            sessionDuration
        );
        
        return {
            id: uuidv4(),
            startTime,
            endTime,
            activities,
            totalDuration: sessionDuration,
            learner
        };
    }

    /**
    * Determines start time based on learner preferences
    * @param date - Base date
    * @param preferredTimes - Learner's preferred time slots
    * @returns Start time for the session
    */
    private generatePreferredStartTime(date: Date, preferredTimes: string[]): Date {
        const timeRanges: Record<string, [number, number]> = {
            'morning': [8, 11],
            'afternoon': [12, 16],
            'evening': [17, 21],
            'night': [22, 7]
        };

        const preferredTime = this.utility.randomChoice(preferredTimes);
        const [start, end] = timeRanges[preferredTime];
        
        const newDate = new Date(date);
        const hour = this.utility.randomInt(start, end);
        const minute = this.utility.randomInt(0, 59);
        
        return new Date(newDate.setHours(hour, minute, 0, 0));
    }

    /**
     * Calculates session length based on learner characteristics
     * @param learner - Student profile
     * @returns Duration in minutes
     */
    private calculateSessionDuration(learner: Learner): number {
        const baseDuration = learner.profile.averageSessionDuration;
        const effortMultiplier = learner.persona.effort;
        
        // Add variance based on persona type
        let variance = 0;
        switch (learner.persona.type) {
            case 'sprinter':
                variance = this.utility.randomFloat(-0.3, -0.1); // Shorter sessions
                break;
            case 'gritty':
                variance = this.utility.randomFloat(0.1, 0.3); // Longer sessions
                break;
            case 'outlierC':
                variance = this.utility.randomFloat(-0.4, 0.4); // Highly variable
                break;
            default:
                variance = this.utility.randomFloat(-0.2, 0.2); // Normal variance
        }
        
        return Math.max(15, Math.round(baseDuration * effortMultiplier * (1 + variance)));
    }

    /**
    * Creates planned activities for the session
    * @param learner - Student profile
    * @param courseStructure - Available content
    * @param sessionStart - Start time
    * @param sessionDuration - Available time
    * @returns Array of planned activities
    */
    private planSessionActivities(
        learner: Learner,
        courseStructure: CourseStructure,
        sessionStart: Date,
        sessionDuration: number
    ): PlannedActivity[] {
        const plannedActivities: PlannedActivity[] = [];
        let currentTime = new Date(sessionStart);
        let remainingTime = sessionDuration;

        // Adjust number of activities based on persona
        const maxActivities = this.getMaxActivities(learner.persona);
        let activityCount = 0;

        while (remainingTime > 10 && activityCount < maxActivities) {
            const activity = this.selectNextActivity(learner, courseStructure);
            const duration = this.calculateActivityDuration(activity, learner);
            
            if (duration > remainingTime) break;

            const interactions = this.generateActivityInteractions(
                learner, 
                activity, 
                currentTime, 
                duration
            );

            plannedActivities.push({
                id: uuidv4(),
                activity,
                startTime: new Date(currentTime),
                duration,
                interactions,
                completed: this.shouldCompleteActivity(learner),
                score: this.calculateActivityScore(learner)
            });

            currentTime = new Date(currentTime.getTime() + duration * 60000);
            remainingTime -= duration;
            activityCount++;
        }

        return plannedActivities;
    }

    /**
    * Determines maximum activities per session based on persona
    * @param persona - Learner persona
    * @returns Maximum number of activities
    */
    private getMaxActivities(persona: Persona): number {
        switch (persona.type) {
            case 'sprinter':
                return this.utility.randomInt(1, 2);
            case 'gritty':
                return this.utility.randomInt(4, 6);
            case 'struggler':
                return this.utility.randomInt(1, 3);
            case 'outlierD':
                return this.utility.randomInt(5, 7);
            default:
                return this.utility.randomInt(2, 4);
        }
    }

    /**
     * Chooses next activity based on learner preferences
     * @param learner - Student profile
     * @param courseStructure - Available content
     * @returns Selected activity
     */
    private selectNextActivity(learner: Learner, courseStructure: CourseStructure): Activity {
        const { persona } = learner;
        const allActivities = courseStructure.sections.flatMap(section => section.activities);

        // Filter suitable activities based on persona type
        let suitableActivities = allActivities;

        switch (persona.type) {
            case 'struggler':
                // Prefer easier activities (difficulty < 0.4)
                suitableActivities = allActivities.filter(activity =>
                    activity.difficulty < 0.4
                );
                break;

            case 'gritty':
                // Can handle any difficulty, prefer challenging content (difficulty > 0.6)
                suitableActivities = allActivities.filter(activity =>
                    activity.difficulty > 0.6
                );
                break;

            case 'sprinter':
                // Prefer medium difficulty (0.3-0.6)
                suitableActivities = allActivities.filter(activity =>
                    activity.difficulty >= 0.3 && activity.difficulty <= 0.6
                );
                break;

            case 'outlierD':
                // High performer - prefers challenging content (difficulty > 0.5)
                suitableActivities = allActivities.filter(activity =>
                    activity.difficulty > 0.5
                );
                break;

            case 'coaster':
                // Prefers medium difficulty (0.4-0.6)
                suitableActivities = allActivities.filter(activity =>
                    activity.difficulty >= 0.4 && activity.difficulty <= 0.6
                );
                break;
        }

        // If no suitable activities found, fall back to all activities
        if (suitableActivities.length === 0) {
            suitableActivities = allActivities;
        }

        return this.utility.randomChoice(suitableActivities);
    }

    /**
     * Determines activity duration based on content and learner
     * @param activity - Learning activity
     * @param learner - Student profile
     * @returns Duration in minutes
     */
    private calculateActivityDuration(activity: Activity, learner: Learner): number {
        // Parse typicalLearningTime if available, otherwise use default
        let baseDuration = 15; // default 15 minutes
        if (activity.typicalLearningTime) {
            // Assuming typicalLearningTime is in minutes or contains a parseable duration
            const timeMatch = activity.typicalLearningTime.match(/\d+/);
            if (timeMatch) {
                baseDuration = parseInt(timeMatch[0]);
            }
        }

        const { persona } = learner;
        let durationMultiplier = persona.timeMultiplier;

        // Adjust based on persona type
        switch (persona.type) {
            case 'struggler':
                // Strugglers take longer on harder content
                if (activity.difficulty > 0.5) {
                    durationMultiplier *= 1.5;
                }
                // Take longer with dense content
                if (activity.semanticDensity === 'high') {
                    durationMultiplier *= 1.3;
                }
                break;

            case 'sprinter':
                // Sprinters rush through content
                durationMultiplier *= 0.7;
                // Even faster on easy content
                if (activity.difficulty < 0.4) {
                    durationMultiplier *= 0.8;
                }
                break;

            case 'gritty':
                // Gritty learners spend more time on challenging content
                if (activity.difficulty > 0.6) {
                    durationMultiplier *= 1.3;
                }
                // More thorough with interactive content
                if (activity.interactivityLevel === 'high') {
                    durationMultiplier *= 1.2;
                }
                break;

            case 'outlierC':
                // Highly variable duration
                durationMultiplier *= this.utility.randomFloat(0.6, 1.4);
                break;

            case 'coaster':
                // Standard duration with slight variation
                durationMultiplier *= this.utility.randomFloat(0.9, 1.1);
                break;
        }

        // Difficulty multiplier (difficulty is 0-1)
        const difficultyMultiplier = 1 + activity.difficulty;

        // Interactivity level adjustment
        const interactivityMultiplier = activity.interactivityLevel === 'high' ? 1.2 :
            activity.interactivityLevel === 'low' ? 0.8 : 1;

        // Apply effort level from persona
        const effortMultiplier = persona.effort;

        // Calculate final duration with some random variation
        const finalDuration = Math.round(
            baseDuration *
            durationMultiplier *
            difficultyMultiplier *
            interactivityMultiplier *
            effortMultiplier *
            this.utility.randomFloat(0.9, 1.1) // Add 10% random variation
        );

        // Ensure minimum duration of 5 minutes and maximum of 120 minutes
        return Math.min(Math.max(finalDuration, 5), 120);
    }


    /**
     * Creates interaction events for an activity
     * @param learner - Student profile
     * @param activity - Learning activity
     * @param startTime - Activity start
     * @param duration - Activity duration
     * @returns Array of interactions
     */
    private generateActivityInteractions(
        learner: Learner,
        activity: Activity,
        startTime: Date,
        duration: number
    ): ActivityInteraction[] {
        const interactions: ActivityInteraction[] = [];
        let currentTime = new Date(startTime);

        // Initial interaction
        interactions.push({
            id: uuidv4(),
            verb: 'launched',
            timestamp: currentTime
        });

        // Generate interactions based on persona type
        const interactionPoints = this.calculateInteractionPoints(
            duration, 
            learner.persona
        );

        for (const timePoint of interactionPoints) {
            currentTime = new Date(startTime.getTime() + timePoint * 60000);
            const progress = (timePoint / duration) * 100;

            // Add persona-specific interactions
            this.addPersonaSpecificInteractions(
                interactions,
                learner,
                activity,
                currentTime,
                progress
            );
        }

        // Add completion if applicable
        if (this.shouldCompleteActivity(learner)) {
            this.addCompletionInteractions(
                interactions,
                learner,
                activity,
                new Date(startTime.getTime() + duration * 60000)
            );
        }

        return interactions;
    }

    /**
     * Adds persona-specific interaction patterns
     * @param interactions - Current interactions
     * @param learner - Student profile
     * @param activity - Learning activity
     * @param timestamp - Event time
     * @param progress - Activity progress
     */
    private addPersonaSpecificInteractions(
        interactions: ActivityInteraction[],
        learner: Learner,
        activity: Activity,
        timestamp: Date,
        progress: number
    ): void {
        const { type } = learner.persona;

        switch (type) {
            case 'gritty':
                // More detailed interactions
                interactions.push({
                    id: uuidv4(),
                    verb: 'progressed',
                    timestamp,
                    progress: Math.round(progress),
                    result: {
                        duration: `PT${Math.round(progress / 100 * activity.estimatedDuration || 15)}M`
                    }
                });
                if (activity.type === 'assessment') {
                    interactions.push({
                        id: uuidv4(),
                        verb: 'answered',
                        timestamp: new Date(timestamp.getTime() + 1000),
                        result: {
                            success: Math.random() < learner.persona.averageScore
                        }
                    });
                }
                break;

            case 'sprinter':
                // Minimal interactions
                if (progress > 80) {
                    interactions.push({
                        id: uuidv4(),
                        verb: 'progressed',
                        timestamp,
                        progress: 100
                    });
                }
                break;

            default:
                // Standard interactions
                if (progress % 25 === 0) {
                    interactions.push({
                        id: uuidv4(),
                        verb: 'progressed',
                        timestamp,
                        progress: Math.round(progress)
                    });
                }
        }
    }

    /**
     * Determines if learner completes activity
     * @param learner - Student profile
     * @returns Completion status
     */
    private shouldCompleteActivity(learner: Learner): boolean {
        return Math.random() < learner.persona.completionRate;
    }

    /**
     * Generates interaction timing points
     * @param duration - Activity duration
     * @param persona - Learner persona
     * @returns Array of time points
     */
    private calculateInteractionPoints(duration: number, persona: Persona): number[] {
        const points: number[] = [];
        const baseInterval = 5; // Base interval in minutes
        let currentTime = baseInterval;

        // Adjust frequency based on engagement level
        const intervalAdjustment = 1 - (persona.effort * 0.5); // 0.5-1.0
        const interval = Math.max(3, Math.round(baseInterval * intervalAdjustment));

        while (currentTime < duration) {
            // Add some randomness to intervals
            const variance = this.utility.randomFloat(-0.2, 0.2);
            currentTime += interval * (1 + variance);

            if (currentTime < duration) {
                points.push(Math.round(currentTime));
            }
        }

        return points;
    }

    /**
     * Adds completion-related interactions
     * @param interactions - Current interactions
     * @param learner - Student profile
     * @param activity - Learning activity
     * @param timestamp - Completion time
     */
    private addCompletionInteractions(
        interactions: ActivityInteraction[],
        learner: Learner,
        activity: Activity,
        timestamp: Date
    ): void {
        const score = this.calculateActivityScore(learner);

        interactions.push({
            id: uuidv4(),
            verb: 'completed',
            timestamp,
            progress: 100,
            result: {
                score: score,
                completion: true,
                success: score.scaled >= 0.7
            }
        });

        // Add score verb
        interactions.push({
            id: uuidv4(),
            verb: score.scaled >= 0.7 ? 'passed' : 'failed',
            timestamp: new Date(timestamp.getTime() + 1000),
            result: {
                score: score,
                success: score.scaled >= 0.7
            }
        });

        // Add rating if applicable
        if (learner.profile.engagementLevel > 0.5) {
            interactions.push({
                id: uuidv4(),
                verb: 'rated',
                timestamp: new Date(timestamp.getTime() + 2000),
                result: {
                    score: {
                        raw: Math.round(learner.profile.engagementLevel * 5),
                        min: 1,
                        max: 5
                    }
                }
            });
        }
    }

    /**
     * Calculates activity score based on learner performance
     * @param learner - Student profile
     * @returns Score object with scaled and raw values
     */
    private calculateActivityScore(learner: Learner): { scaled: number; raw: number; min: number; max: number; } {
        const baseScore = learner.persona.averageScore;
        const variance = this.utility.randomFloat(-0.1, 0.1);
        const scaled = Math.max(0, Math.min(1, baseScore + variance));

        return {
            scaled,
            raw: Math.round(scaled * 100),
            min: 0,
            max: 100
        };
    }

}

export default LearningSessionGenerator;
