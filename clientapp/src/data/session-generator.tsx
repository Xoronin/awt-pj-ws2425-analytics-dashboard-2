import ActivityGenerator from './activity-generator';
import { CourseData, Verb, LearnerProfile, LearningSession } from '../types/types';


/**
 * Generates simulated learning sessions with realistic student interactions
 */
class LearningSessionGenerator {
    private readonly courseData: CourseData;
    private readonly numberOfWeeks: number;
    private readonly verbs: Verb[];
    private activityGenerator: ActivityGenerator;

    constructor(courseData: CourseData, numberOfWeeks: number, verbs: Verb[]) {
        this.courseData = courseData;
        this.numberOfWeeks = numberOfWeeks;
        this.verbs = verbs;
        this.activityGenerator = new ActivityGenerator(this.courseData, this.verbs, this.numberOfWeeks)
    }

    /**
     * Generates learning sessions for a learner over the specified number of weeks.
     * @param learnerProfile - The profile of the learner for whom the sessions will be generated.
     * @param startDate - The start date for the course.
     * @returns An array of learning sessions for the learner.
     */
    public generateLearnerSessions(
        learnerProfile: LearnerProfile,
        startDate: Date,
    ): LearningSession[] {
        const sessions: LearningSession[] = [];

        // Generate sessions for each week
        for (let week = 0; week < this.numberOfWeeks; week++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + (week * 7));

            // Get sessions for this week based on profile and current phase
            const sessionsPerWeek = this.getSessionsPerWeek(learnerProfile, week);

            // Create sessions for this week
            for (let i = 0; i < sessionsPerWeek; i++) {
                const session = this.createSession(learnerProfile, weekStart, i, week);
                sessions.push(session);
            }

            //console.log(`CurrentWeek: ${week}, learner: ${learnerProfile.personaType}`)
        }

        return sessions;
    }

    /**
     * Determines the number of sessions per week based on the learner's effort and consistency metrics.
     * @param profile - The profile of the learner.
     * @param currentWeek - The current week of the course.
     * @returns The number of sessions per week for the learner.
     */
    private getSessionsPerWeek(
        profile: LearnerProfile,
        currentWeek: number,
    ): number {
        const effort = this.activityGenerator.getMetricValue(profile, 'effort', currentWeek);
        const consistency = this.activityGenerator.getMetricValue(profile, 'consistency', currentWeek);

        // Base calculation weighted between effort (60%) and consistency (40%)
        const weightedValue = (effort * 0.6) + (consistency * 0.4);
        const baseSessions = Math.max(1, Math.round(weightedValue * 5) + 1);

        // Variance based on consistency level
        const varianceChance = consistency >= 0.8 ? 0.9 : // High consistency = mostly stable
            consistency <= 0.2 ? 0.3 : // Low consistency = more variance
                0.7; // Default
        const variance = Math.random() < varianceChance ? 0 : (Math.random() < 0.5 ? -1 : 1);

        return Math.max(1, Math.min(6, baseSessions + variance));
    }

    /**
     * Creates a single learning session for the given learner and week.
     * @param profile - The profile of the learner.
     * @param weekStart - The start date of the week.
     * @param dayOffset - The offset from the start of the week (in days) for the session.
     * @param currentWeek - The current week of the course.
     * @returns The created learning session.
     */
    private createSession(
        profile: LearnerProfile,
        weekStart: Date,
        dayOffset: number,
        currentWeek: number,
    ): LearningSession {
        const sessionDate = new Date(weekStart);
        sessionDate.setDate(sessionDate.getDate() + dayOffset);
        const startTime = this.getSessionStartTime(sessionDate);

        const sessionDuration = this.getSessionDuration(profile, currentWeek);

        const endTime = new Date(startTime.getTime() + sessionDuration * 60000);

        const activities = this.activityGenerator.selectActivities(
            profile,
            sessionDuration,
            startTime,
            currentWeek,
        );

        return {
            learner: profile,
            activities,
            startTime,
            endTime,
            totalDuration: sessionDuration
        };
    }

    /**
     * Gets a reasonable start time for a session, between 9 AM and 8 PM with random minutes.
     * @param date - The date for which the start time should be generated.
     * @returns The generated start time.
     */
    private getSessionStartTime(date: Date): Date {
        const startTime = new Date(date);
        // Random hour between 9 AM and 8 PM
        const hour = 9 + Math.floor(Math.random() * 11);
        // Random minutes (0-59)
        const minutes = Math.floor(Math.random() * 60);
        startTime.setHours(hour, minutes, 0, 0);
        return startTime;
    }

    /**
     * Gets the session duration for the given learner profile and current week.
     * @param profile - The profile of the learner.
     * @param currentWeek - The current week of the course.
     * @returns The duration of the session in minutes.
     */
    private getSessionDuration(profile: LearnerProfile, currentWeek: number): number {
        const BASE_DURATION = 60; // Base duration for average metrics

        // Get metrics
        const durationMetric = this.activityGenerator.getMetricValue(profile, 'duration', currentWeek);
        const effort = this.activityGenerator.getMetricValue(profile, 'effort', currentWeek);
        const consistency = this.activityGenerator.getMetricValue(profile, 'consistency', currentWeek);

        // Calculate duration multiplier centered around 1.0 for average metrics (0.6)
        const averageMetric = 0.6;
        const normalizedDuration = (durationMetric - averageMetric) * 1.67;
        const normalizedEffort = (effort - averageMetric) * 1.67;
        const normalizedConsistency = (consistency - averageMetric) * 1.67;

        // Weighted multiplier
        const multiplier = 1 + ((normalizedDuration * 0.5) + (normalizedEffort * 0.3) + (normalizedConsistency * 0.2));

        // Add variance based on consistency
        const varianceRange = consistency >= 0.8 ? 5 : // High consistency = small variance
            consistency <= 0.2 ? 15 : // Low consistency = large variance
                10; // Medium variance

        const variance = Math.floor(Math.random() * (varianceRange * 2 + 1)) - varianceRange;

        // Scale duration: 
        // - Minimum duration is 45 minutes (0.75 * BASE_DURATION)
        // - Maximum duration is 90 minutes (1.5 * BASE_DURATION)
        const duration = Math.round(BASE_DURATION * Math.max(0.75, Math.min(1.5, multiplier)));

        return Math.max(45, Math.min(90, duration + variance));
    }
}

export default LearningSessionGenerator;
