import { v4 as uuidv4 } from 'uuid';
import { LearnerProfile, Persona, personas, outliers } from './learner-generator';
import LearnerGenerator from './learner-generator';
import { verbs, Activity, CourseStructure } from './course-data-generator';
import CourseDataGenerator from './course-data-generator';
import { XAPIDataService } from '../services/xapi-service';
import { LearningSessionGenerator, LearningSession, Learner, ActivityInteraction } from './session-generator';
import Utility from '../helper/utility';
// Interfaces for learners, xAPI statements, and sessions

export interface XAPIStatement {
    actor: {
        mbox: string;
    };
    timestamp: string;
    version: string;
    id: string;
    result?: {
        score?: {
            scaled?: number;
            min?: number;
            max?: number;
            raw?: number;
        };
        completion?: boolean;
        success?: boolean;
        duration?: string;
    };
    verb: {
        id: string;
        display: {
            en: string;
        };
    };
    object: {
        id: string;
        objectType: string;
        definition: {
            type: string;
            name: {
                en: string;
            };
            description?: {
                en: string;
            };
            extensions?: {
                [key: string]: string;
            };
        };
    };
    context: {
        instructor?: {
            mbox: string;
        };
        extensions?: {
            [key: string]: string;
        };
    };
}

// Valid verbs for xAPI statements
type ValidVerb = keyof typeof verbs;

class GenerateXAPIData {
    private courseStructure: CourseStructure | null = null;
    private learners: Learner[] = [];
    private statements: XAPIStatement[] = [];
    private dataService: XAPIDataService;
    private utility: Utility;
    private learnerGenerator: LearnerGenerator;
    private sessionGenerator: LearningSessionGenerator;
    private courseDataGenerator: CourseDataGenerator

    constructor() {
        this.dataService = new XAPIDataService();
        this.utility = new Utility();
        this.learnerGenerator = new LearnerGenerator();
        this.sessionGenerator = new LearningSessionGenerator();
        this.courseDataGenerator = new CourseDataGenerator();
    }

    // Initialize the course structure by loading data from a file
    async initialize(): Promise<void> {
        this.courseStructure = await this.courseDataGenerator.loadCourseData();
        this.generateLearnerProfiles();
    }

    // Generate learner profiles based on predefined personas
    private generateLearnerProfiles(): void {
        const allPersonas = [...personas, ...outliers];
        for (const persona of allPersonas) {
            const learner: Learner = {
                id: uuidv4(),
                persona,
                profile: this.learnerGenerator.createLearnerProfile(persona)
            };
            this.learners.push(learner);
        }
    }

    private generateSession(learner: Learner, date: Date): LearningSession | null {
        if (!this.courseStructure) {
            throw new Error('Course structure not initialized');
        }

        // Only generate a session if the learner is likely to participate
        if (Math.random() < learner.profile.completionProbability) {
            return this.sessionGenerator.generateSession(
                learner,
                this.courseStructure,
                date
            );
        }

        return null;
    }

    private convertSessionToStatements(session: LearningSession): XAPIStatement[] {
        const statements: XAPIStatement[] = [];

        // Session initialization
        statements.push(this.createStatement(
            session.learner,
            'initialized',
            session.startTime
        ));

        // Process each activity and its interactions
        for (const plannedActivity of session.activities) {
            for (const interaction of plannedActivity.interactions) {
                statements.push(this.createStatement(
                    session.learner,
                    interaction.verb as ValidVerb,
                    interaction.timestamp,
                    plannedActivity.activity,
                    interaction
                ));           
            }
        }

        // Session termination
        statements.push(this.createStatement(
            session.learner,
            'exited',
            session.endTime
        ));

        return statements;
    }


    // Create an xAPI statement for a learner
    private createStatement(
        learner: Learner,
        verb: ValidVerb,
        timestamp: Date,
        activity?: Activity,
        interaction?: ActivityInteraction
    ): XAPIStatement {
        const defaultObject = {
            id: this.courseStructure?.id || 'https://example.com/default',
            objectType: 'Activity',
            definition: {
                type: 'http://adlnet.gov/expapi/activities/course',
                name: {
                    en: this.courseStructure?.title || 'Default Course'
                },
                description: {
                    en: this.courseStructure?.description || ''
                }
            }
        };

        // Generate result based on interaction or learner profile
        const result = interaction?.result || this.generateResult(verb, learner.profile);

        const statement: XAPIStatement = {
            id: uuidv4(),
            actor: {
                mbox: `mailto:${learner.id}@example.com`,
            },
            verb: {
                id: verbs[verb],
                display: {
                    en: verb
                }
            },
            object: activity ? {
                id: activity.href || `https://example.com/activities/${activity.id}`,
                objectType: 'Activity',
                definition: {
                    type: activity.type || 'http://adlnet.gov/expapi/activities/module',
                    name: {
                        en: activity.title
                    },
                    description: activity.description ? {
                        en: activity.description
                    } : undefined,
                    extensions: {
                        'https://w3id.org/learning-analytics/learning-management-system/external-id': activity.id
                    }
                }
            } : defaultObject,
            context: {
                instructor: {
                    mbox: `mailto:instructor@example.com`,
                },
                extensions: {
                    'https://example.com/activities/extensions/course_id': activity?.id || this.courseStructure?.id || ''
                }
            },
            timestamp: timestamp.toISOString(),
            version: "1.0.0",
            ...(result && { result })
        };

        return statement;
    }

    // Generate the results for an activity if the verb is prescribed, scored, completed, failed, passed or rated
    private generateResult(verb: ValidVerb, profile: LearnerProfile): XAPIStatement['result'] | undefined {
        switch (verb) {
            case 'prescribed':
                return {
                    score: {
                        min: 0,
                        max: 9,
                        scaled: profile.assessmentPerformance
                    },
                };
            case 'scored':
                return {
                    score: {
                        min: 0,
                        max: 9,
                        scaled: profile.assessmentPerformance
                    },
                };
            case 'completed':
                return {
                    score: {
                        raw: Math.round(profile.assessmentPerformance * 100),
                        min: 0,
                        max: 100,
                        scaled: profile.assessmentPerformance
                    },
                    completion: true,
                    success: profile.assessmentPerformance >= 0.7
                };
            case 'failed':
                return {
                    score: {
                        raw: Math.round(profile.assessmentPerformance * 100),
                        min: 0,
                        max: 100,
                        scaled: profile.assessmentPerformance
                    },
                    completion: true,
                    success: false,
                    duration: `PT${Math.round(profile.averageSessionDuration)}M`
                };
            case 'passed':
                return {
                    score: {
                        raw: Math.round(profile.assessmentPerformance * 100),
                        min: 0,
                        max: 100,
                        scaled: profile.assessmentPerformance
                    },
                    completion: true,
                    success: true,
                    duration: `PT${Math.round(profile.averageSessionDuration)}M`
                };
            case 'rated':
                const rating = Math.round(profile.engagementLevel * 5);
                return {
                    score: {
                        raw: rating,
                        min: 1,
                        max: 5
                    }
                };
            default:
                return undefined;
        }
    }

    // Generate and save all statements in the xAPI data service
    async generateAndSaveStatements(days: number, onProgress?: (progress: number) => void): Promise<void> {
        try {
            if (!this.courseStructure) {
                await this.initialize();
            }

            // Reset statements array
            this.statements = [];
            let progressCount = 0;
            const totalSteps = this.learners.length * days;

            for (const learner of this.learners) {
                for (let day = 0; day < days; day++) {
                    const date = new Date();
                    date.setDate(date.getDate() - day);

                    // Generate session
                    const session = this.generateSession(learner, date);
                    if (session) {
                        const sessionStatements = this.convertSessionToStatements(session);
                        this.statements.push(...sessionStatements);
                    }

                    // Update progress
                    progressCount++;
                    if (onProgress) {
                        onProgress((progressCount / totalSteps) * 100);
                    }
                }
            }

            console.log(`Generated ${this.statements.length} statements`);

            // Save all statements in one operation
            await this.dataService.saveBulkStatements(this.statements);
            console.log('All statements saved successfully');

        } catch (error) {
            console.error('Error in generate and save process:', error);
            throw error;
        }
    }

    // Function to check if the service is connected
    async validateService(): Promise<boolean> {
        try {
            // Try to fetch statements to validate the service is working
            await this.dataService.getStatements();
            return true;
        } catch (error) {
            console.error('Service validation failed:', error);
            return false;
        }
    }

}

export default GenerateXAPIData;