import Utility from './utility';

export interface Persona {
  id: string;
    type: 'struggler' | 'average' | 'sprinter' | 'gritty' | 'coaster' | 'outlierA' | 'outlierB' | 'outlierC' | 'outlierD';
  completionRate: number;
  averageScore: number;
  timeMultiplier: number;
  effort: number;
}

export const personas: Persona[] = [
    {
        id: '1',
        type: 'struggler',
        completionRate: 0.3,            // 30% consistency
        averageScore: 0.1,              // Very low scores
        timeMultiplier: 1,              // Average duration
        effort: 0.5                     // Low effort
    },
    {
        id: '2',
        type: 'average',
        completionRate: 0.5,            // Average consistency
        averageScore: 0.5,              // Average scores
        timeMultiplier: 1,              // Average duration
        effort: 1                       // Average effort
    },
    {
        id: '3',
        type: 'sprinter',
        completionRate: 0.1,            // Very low consistency
        averageScore: 0.4,              // Low scores
        timeMultiplier: 0.7,            // Short duration
        effort: 0.2                     // Very low effort
    },
    {
        id: '4',
        type: 'gritty',
        completionRate: 0.9,            // High consistency
        averageScore: 0.9,              // Very high scores
        timeMultiplier: 1.5,            // Long duration
        effort: 1.8                     // Very high effort
    },
    {
        id: '5',
        type: 'coaster',
        completionRate: 0.7,            // Average consistency
        averageScore: 0.6,              // Average scores
        timeMultiplier: 1,              // Average duration
        effort: 0.5                     // Low effort
    }
];

export const outliers: Persona[] = [
    {
        id: '6',
        type: 'outlierA',
        completionRate: 0.7,            // Initially high consistency
        averageScore: 0.8,              // High scores
        timeMultiplier: 1.2,            // Starts as average but reduces later
        effort: 0.3                     // Drops significantly (does not complete last assignments)
    },
    {
        id: '7',
        type: 'outlierB',
        completionRate: 0.4,            // Loses consistency over time
        averageScore: 0.5,              // Average scores
        timeMultiplier: 1,              // Average duration
        effort: 0.2                     // Low effort throughout
    },
    {
        id: '8',
        type: 'outlierC',
        completionRate: 0.9,            // Very high consistency
        averageScore: 0.7,              // Average to high scores
        timeMultiplier: 0.8,            // Short bursts of effort
        effort: 2.0                     // Extremely high effort in short time
    },
    {
        id: '9',
        type: 'outlierD',
        completionRate: 0.95,           // Very high consistency
        averageScore: 0.95,             // Excellent scores
        timeMultiplier: 1.5,            // Longer duration
        effort: 1.7                     // High effort consistently
    }
];

export interface LearnerProfile {
    completionProbability: number;
    assessmentPerformance: number;
    engagementLevel: number;
    learningStyle: string;
    preferredTimes: string[];
    averageSessionDuration: number;
}


class LearnerGenerator {
    private utility: Utility;

    constructor() {
        this.utility = new Utility();
    }

    /**
     * Generate a learner profile using persona attributes.
     */
    createLearnerProfile(persona: Persona): LearnerProfile {
        return {
            completionProbability: persona.completionRate,
            assessmentPerformance: persona.averageScore,
            engagementLevel: persona.effort,
            learningStyle: this.utility.randomChoice(['visual', 'auditory', 'reading', 'kinesthetic']),
            preferredTimes: this.generatePreferredTimes(),
            averageSessionDuration: this.generateSessionDuration(persona.timeMultiplier)
        };
    }

    /**
     * Generate preferred times for a learner (e.g., morning, evening).
     */
    private generatePreferredTimes(): string[] {
        const times = ['morning', 'afternoon', 'evening', 'night'];
        const count = this.utility.randomInt(1, 2);
        return times.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    /**
     * Generate session duration for a learner based on their time multiplier.
     */
    private generateSessionDuration(timeMultiplier: number): number {
        const baseDurations: Record<string, [number, number]> = {
            active: [45, 90],
            average: [30, 60],
            struggling: [20, 45],
            instructor: [60, 120]
        };

        const category = this.getPersonaCategory(timeMultiplier);
        const [min, max] = baseDurations[category];
        return this.utility.randomInt(min, max);
    }

    /**
     * Determine persona category based on time multiplier.
     */
    private getPersonaCategory(timeMultiplier: number): string {
        if (timeMultiplier < 1) return 'active';
        if (timeMultiplier === 1) return 'average';
        if (timeMultiplier > 1) return 'struggling';
        return 'instructor';
    }
}

export default LearnerGenerator;