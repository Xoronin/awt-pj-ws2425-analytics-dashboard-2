import Utility from '../helper/utility';
import LearnerService from '../services/learner-service';

export interface LearnerProfile {
    id: string;
    email: string;
    personaType: 'struggler' | 'average' | 'sprinter' | 'gritty' | 'coaster' | 'outlierA' | 'outlierB' | 'outlierC' | 'outlierD';
    metrics: {
        consistency: number | { start: number; middle: number; end: number; };
        scores: number | { start: number; middle: number; end: number; };
        duration: number | { start: number; middle: number; end: number; };
        effort: number | { start: number; middle: number; end: number; };
    };
}

type MetricValue = 'very low' | 'low' | 'average' | 'high' | 'very high';

export interface Persona {
    id: string;
    type: 'struggler' | 'average' | 'sprinter' | 'gritty' | 'coaster';
    consistency: MetricValue;
    scores: MetricValue;
    duration: MetricValue;
    effort: MetricValue;
}

export interface Outlier {
    id: string;
    type: 'outlierA' | 'outlierB' | 'outlierC' | 'outlierD';
    consistency: {
        start: MetricValue,
        middle: MetricValue,
        end: MetricValue,
    };
    scores: {
        start: MetricValue,
        middle: MetricValue,
        end: MetricValue,
    }
    duration: {
        start: MetricValue,
        middle: MetricValue,
        end: MetricValue,
    }
    effort: {
        start: MetricValue,
        middle: MetricValue,
        end: MetricValue,
    }
}

export const personas: Persona[] = [
    {
        id: '1',
        type: 'struggler',
        consistency: 'average',
        scores: 'very low',
        duration: 'average',
        effort: 'low'
    },
    {
        id: '2',
        type: 'average',
        consistency: 'average',
        scores: 'average',
        duration: 'average',
        effort: 'average'
    },
    {
        id: '3',
        type: 'sprinter',
        consistency: 'very low',
        scores: 'low',
        duration: 'low',
        effort: 'very low'
    },
    {
        id: '4',
        type: 'gritty',
        consistency: 'high',
        scores: 'very high',
        duration: 'high',
        effort: 'very high'
    },
    {
        id: '5',
        type: 'coaster',
        consistency: 'average',
        scores: 'average',
        duration: 'average',
        effort: 'low'
    }
];

export const outliers: Outlier[] = [
    {
        id: '6',
        type: 'outlierA',
        consistency: {
            start: 'high',
            middle: 'average',
            end: 'low'
        },
        scores: {
            start: 'high',
            middle: 'average',
            end: 'low'
        },
        duration: {
            start: 'high',
            middle: 'average',
            end: 'low'
        },
        effort: {
            start: 'high',
            middle: 'average',
            end: 'low'
        }
    },
    {
        id: '7',
        type: 'outlierB',
        consistency: {
            start: 'average',
            middle: 'low',
            end: 'very low'
        },
        scores: {
            start: 'average',
            middle: 'average',
            end: 'average'
        },
        duration: {
            start: 'average',
            middle: 'average',
            end: 'average'
        },
        effort: {
            start: 'low',
            middle: 'low',
            end: 'low'
        },
    },
    {
        id: '8',
        type: 'outlierC',
        consistency: {
            start: 'very high',
            middle: 'very high',
            end: 'very high'
        },
        scores: {
            start: 'average',
            middle: 'average',
            end: 'average'
        },
        duration: {
            start: 'average',
            middle: 'average',
            end: 'average'
        },
        effort: {
            start: 'very high',
            middle: 'very high',
            end: 'very high'
        },
    },
    {
        id: '9',
        type: 'outlierD',
        consistency: {
            start: 'very high',
            middle: 'very high',
            end: 'very high'
        },
        scores: {
            start: 'very high',
            middle: 'very high',
            end: 'very high'
        },
        duration: {
            start: 'average',
            middle: 'average',
            end: 'average'
        },
        effort: {
            start: 'high',
            middle: 'high',
            end: 'high'
        },
    },
];

/**
 * LearnerGenerator class
 * Responsible for generating realistic learner profiles based on predefined personas and outliers
 * Uses a percentage-based distribution to create a realistic representation of a learning cohort
 */
class LearnerGenerator {
    private utility: Utility;

    /**
     * Mapping of descriptive values to numerical scores
     * Used to convert qualitative descriptions into quantitative metrics
     */
    private readonly valueMap: Record<MetricValue, number> = {
        'very low': 0.2,   // 20% performance/engagement
        'low': 0.4,        // 40% performance/engagement
        'average': 0.6,    // 60% performance/engagement
        'high': 0.8,       // 80% performance/engagement
        'very high': 1.0   // 100% performance/engagement
    };

    /**
     * Distribution percentages for regular personas
     * Based on typical distribution in learning environments
     * Total adds up to 100% (1.0)
     */
    private readonly personaDistribution = {
        'struggler': 0.30, // Students who consistently face challenges
        'average': 0.39,   // Typical performers
        'sprinter': 0.08,  // Quick but inconsistent learners
        'gritty': 0.10,    // High-performing, highly motivated learners
        'coaster': 0.13    // Minimal effort, adequate performers
    };

    /**
     * Distribution percentages for outlier cases
     * Represents exceptional cases that don't fit regular patterns
     * Intentionally small percentages to reflect rare cases
     */
    private readonly outlierDistribution = {
        'outlierA': 0.02, // Declining performance over time
        'outlierB': 0.01, // Consistent scores but declining engagement
        'outlierC': 0.01, // High effort but average performance
        'outlierD': 0.01  // Exceptional performance with average effort
    };

    constructor() {
        this.utility = new Utility();
    }

    /**
     * Generates a random variation around a base value
     * Used to add realistic variability to metrics while staying within meaningful bounds
     * 
     * @param baseValue - The central value to vary around (0-1)
     * @param variance - The maximum amount of variation allowed (default: 0.1)
     * @returns A number between 0 and 1, varying from the base value
     */
    private generateRandomVariation(baseValue: number, variance: number = 0.1): number {
        const min = Math.max(0, baseValue - variance);
        const max = Math.min(1, baseValue + variance);
        return Number((min + Math.random() * (max - min)).toFixed(2));
    }

    /**
     * Converts descriptive string values to numerical values
     * Maps qualitative descriptions to quantitative metrics
     * 
     * @param value - Descriptive string (e.g., 'very low', 'high')
     * @returns Numerical value between 0 and 1
     */
    private convertStringToNumber(value: string): number {
        return this.valueMap[value as MetricValue] || 0.6; // Default to average if unknown
    }

    /**
     * Generates metrics for a regular persona
     * Creates consistent metrics based on persona characteristics with some random variation
     * 
     * @param persona - The persona to base metrics on
     * @returns Object containing numerical metrics
     */
    private generateMetricsFromPersona(persona: Persona): LearnerProfile['metrics'] {
        return {
            consistency: this.generateRandomVariation(this.convertStringToNumber(persona.consistency)),
            scores: this.generateRandomVariation(this.convertStringToNumber(persona.scores)),
            duration: this.generateRandomVariation(this.convertStringToNumber(persona.duration)),
            effort: this.generateRandomVariation(this.convertStringToNumber(persona.effort))
        };
    }

    /**
     * Generates metrics for an outlier profile
     * Creates metrics that change over time (start/middle/end) based on outlier characteristics
     * 
     * @param outlier - The outlier profile to base metrics on
     * @returns Object containing metrics with temporal progression
     */
    private generateMetricsFromOutlier(outlier: Outlier): LearnerProfile['metrics'] {
        return {
            consistency: {
                start: this.generateRandomVariation(this.convertStringToNumber(outlier.consistency.start)),
                middle: this.generateRandomVariation(this.convertStringToNumber(outlier.consistency.middle)),
                end: this.generateRandomVariation(this.convertStringToNumber(outlier.consistency.end))
            },
            scores: {
                start: this.generateRandomVariation(this.convertStringToNumber(outlier.scores.start)),
                middle: this.generateRandomVariation(this.convertStringToNumber(outlier.scores.middle)),
                end: this.generateRandomVariation(this.convertStringToNumber(outlier.scores.end))
            },
            duration: {
                start: this.generateRandomVariation(this.convertStringToNumber(outlier.duration.start)),
                middle: this.generateRandomVariation(this.convertStringToNumber(outlier.duration.middle)),
                end: this.generateRandomVariation(this.convertStringToNumber(outlier.duration.end))
            },
            effort: {
                start: this.generateRandomVariation(this.convertStringToNumber(outlier.effort.start)),
                middle: this.generateRandomVariation(this.convertStringToNumber(outlier.effort.middle)),
                end: this.generateRandomVariation(this.convertStringToNumber(outlier.effort.end))
            }
        };
    }

    /**
     * Generates a unique email address for each learner
     * Format: learner_[type]_[id]@example.com
     * 
     * @param id - Unique identifier for the learner
     * @param type - Persona or outlier type
     * @returns Generated email address
     */
    private generateEmail(id: string, type: string): string {
        return `learner_${type.toLowerCase()}_${id}@example.com`;
    }

    /**
     * Calculates the number of learners for each persona and outlier type
     * Based on the defined distributions and total number of learners
     * 
     * @param totalLearners - Total number of learners to generate
     * @returns Maps containing the count for each persona and outlier type
     */
    private calculateCounts(totalLearners: number): {
        personaCounts: Map<string, number>,
        outlierCounts: Map<string, number>
    } {
        const personaCounts = new Map<string, number>();
        const outlierCounts = new Map<string, number>();

        // Calculate counts for regular personas
        for (const [type, percentage] of Object.entries(this.personaDistribution)) {
            personaCounts.set(type, Math.round(totalLearners * percentage));
        }

        // Calculate counts for outliers
        for (const [type, percentage] of Object.entries(this.outlierDistribution)) {
            outlierCounts.set(type, Math.round(totalLearners * percentage));
        }

        return { personaCounts, outlierCounts };
    }

    /**
     * Main method to generate learner profiles
     * Creates a set of profiles based on the defined personas and outliers
     * 
     * @param totalLearners - Total number of learner profiles to generate
     * @param personas - Array of persona definitions
     * @param outliers - Array of outlier definitions
     * @returns Array of generated learner profiles
     */
    public generateLearnerProfiles(totalLearners: number): LearnerProfile[] {
        const { personaCounts, outlierCounts } = this.calculateCounts(totalLearners);
        const profiles: LearnerProfile[] = [];
        let profileId = 1;

        // Generate regular persona profiles
        personas.forEach(persona => {
            const count = personaCounts.get(persona.type) || 0;
            for (let i = 0; i < count; i++) {
                profiles.push({
                    id: `${profileId}`,
                    email: this.generateEmail(`${profileId}`, persona.type),
                    personaType: persona.type,
                    metrics: this.generateMetricsFromPersona(persona)
                });
                profileId++;
            }
        });

        // Generate outlier profiles
        outliers.forEach(outlier => {
            const count = outlierCounts.get(outlier.type) || 0;
            for (let i = 0; i < count; i++) {
                profiles.push({
                    id: `${profileId}`,
                    email: this.generateEmail(`${profileId}`, outlier.type),
                    personaType: outlier.type,
                    metrics: this.generateMetricsFromOutlier(outlier)
                });
                profileId++;
            }
        });

        return profiles;
    }

    /**
     * Utility method to analyze the distribution of generated profiles
     * Helps verify that the actual distribution matches the intended distribution
     * 
     * @param profiles - Array of generated learner profiles
     * @returns Object containing count and percentage for each profile type
     */
    public getDistributionInfo(profiles: LearnerProfile[]): { [key: string]: { count: number, percentage: string } } {
        const distribution: { [key: string]: { count: number, percentage: string } } = {};
        const total = profiles.length;

        profiles.forEach(profile => {
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
    }

    /**
    * Example usage combining LearnerGenerator and LearnerService
    * Shows the complete flow from generation to storage
    */
    async generateAndStoreLearners() {
        try {
            const learnerService = new LearnerService();

            // Generate learner profiles
            const totalLearners = 50;
            const learnerProfiles = this.generateLearnerProfiles(totalLearners);
            console.log('Learner profiles: ', learnerProfiles);

            // Store profiles in database
            const storeResult = await learnerService.storeLearnerProfiles(learnerProfiles);
            console.log('Store result:', storeResult);

            // Get distribution info
            const distribution = this.getDistributionInfo(learnerProfiles);
            console.log('Distribution:', distribution);

        } catch (error) {
            console.error('Error in generate and store process:', error);
            throw error;
        }
    }
}

export default LearnerGenerator;
