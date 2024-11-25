//import { v4 as uuidv4 } from 'uuid';
import LearnerGenerator, { LearnerProfile, personas, outliers } from './learner-generator';
import CourseDataGenerator, {Activity, CourseStructure } from './course-data-generator';
import LearningSessionGenerator, { LearningSession } from './session-generator';
import { XAPIDataService } from '../services/xapi-service';
import VerbService, { Verb } from '../services/verb-service';
import LearnerService from '../services/learner-service';
//import Utility from '../helper/utility';

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

/**
 * Generates xAPI statements from simulated learning sessions and learner profiles
 */
class GenerateXAPIData {
    private courseData: CourseStructure | null = null;
    private verbs: Verb[] | null = null;
//    private learners: Learner[] = [];
//    private statements: XAPIStatement[] = [];
    private dataService: XAPIDataService;
//    private utility: Utility;
    //private learnerGenerator: LearnerGenerator;
    private sessionGenerator!: LearningSessionGenerator;
    private courseDataGenerator: CourseDataGenerator;
    private verbService: VerbService;
    private learnerService: LearnerService;

    constructor() {
        this.dataService = new XAPIDataService();
        //        this.utility = new Utility();
        this.learnerService = new LearnerService();
        this.courseDataGenerator = new CourseDataGenerator();
        this.verbService = new VerbService();
    }

    /**
     * Generates sessions for all learners
     * @param totalLearners - Number of learners to generate sessions for
     * @param numberOfWeeks - Duration of the course in weeks
     * @returns Generated sessions grouped by learner
     */
    public async generateAllSessions(totalLearners: number, numberOfWeeks: number) {
        try {
            // 1. Generate learner profiles
            this.courseData = await this.courseDataGenerator.loadCourseData();
            this.verbs = await this.verbService.getVerbs();
            this.sessionGenerator = new LearningSessionGenerator(this.courseData, numberOfWeeks, this.verbs,);

            const learnerProfiles = await this.learnerService.getLearnerProfiles();
            //console.log(`Generated ${learnerProfiles.length} learner profiles`);

            // 2. Set course start date (e.g., 2 weeks from now)
            const courseStartDate = new Date();
            courseStartDate.setDate(courseStartDate.getDate() + 14);

            // 3. Generate sessions for each learner
            const allSessions = new Map<string, LearningSession[]>();

            for (const learner of learnerProfiles) {
                const learnerSessions = this.sessionGenerator.generateLearnerSessions(
                    learner,
                    courseStartDate
                );

                allSessions.set(learner.id, learnerSessions);

                console.log(`Generated ${learnerSessions.length} sessions for learner ${learner.id} (${learner.personaType})`);
            }

            // 4. Generate statistics about the sessions
            //this.printSessionStatistics(allSessions);

            return allSessions;

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Failed to generate sessions:', errorMessage);
            throw new Error(`Session generation failed: ${errorMessage}`);
        }
    }

    /**
     * Prints statistics about the generated sessions
     */
    private printSessionStatistics(allSessions: Map<string, LearningSession[]>) {
        let totalSessions = 0;
        let totalActivities = 0;
        let totalDuration = 0;

        allSessions.forEach((sessions, learnerId) => {
            totalSessions += sessions.length;

            sessions.forEach(session => {
                totalActivities += session.activities.length;
                totalDuration += session.totalDuration;
            });
        });

        console.log('\nSession Generation Statistics:');
        console.log(`Total Learners: ${allSessions.size}`);
        console.log(`Total Sessions: ${totalSessions}`);
        console.log(`Total Activities: ${totalActivities}`);
        console.log(`Average Sessions per Learner: ${(totalSessions / allSessions.size).toFixed(1)}`);
        console.log(`Average Activities per Session: ${(totalActivities / totalSessions).toFixed(1)}`);
        console.log(`Average Session Duration: ${(totalDuration / totalSessions).toFixed(1)} minutes`);
    }


//    /**
//     * Initializes the course structure and generates learner profiles
//     */
//    async initialize(): Promise<void> {

    // Generate 10 sessions for a learner starting from today
    //const sessions = generator.generateLearnerSessions(
    //    learnerProfile,
    //    new Date(),
    //    10
    //);

    //// Sessions can then be used to generate xAPI statements
    //const statements = sessions.flatMap(session =>
    //    session.activities.flatMap(activity =>
    //        activity.events.map(event => createXAPIStatement(session, activity, event))
    //    )
    //);

//        this.verbs = await this.verbService.getVerbs();
//        this.generateLearnerProfiles();
//    }

//    /**
//     * Creates learner profiles for each predefined persona
//     */
//    //private generateLearnerProfiles(): void {
//    //    const allPersonas = [...personas, ...outliers];
//    //    for (const persona of allPersonas) {
//    //        const learner: Learner = {
//    //            id: uuidv4(),
//    //            persona,
//    //            profile: this.learnerGenerator.createLearnerProfile(persona)
//    //        };
//    //        this.learners.push(learner);
//    //    }
//    //}

//    /**
//     * Creates a learning session for a learner if they're likely to participate
//     * @param learner - Student profile
//     * @param date - Session date
//     * @returns Learning session or null
//     */
//    private generateSession(learner: Learner, date: Date): LearningSession | null {
//        if (!this.courseStructure) {
//            throw new Error('Course structure not initialized');
//        }

//        // Only generate a session if the learner is likely to participate
//        if (Math.random() < learner.profile.completionProbability) {
//            return this.sessionGenerator.generateSession(
//                learner,
//                this.courseStructure,
//                date
//            );
//        }

//        return null;
//    }

//    /**
//     * Gets verb by verb name with fallback
//     */
//    private getVerb(verbName: string): Verb {
//        if (!this.verbs) {
//            throw new Error('Verbs not initialized');
//        }

//        const verb = this.verbs.find(v => v.prefLabel === verbName);
//        if (!verb) {
//            // Provide a default verb if not found
//            return {
//                id: `http://adlnet.gov/expapi/verbs/${verbName}`,
//                type: 'Verb',
//                prefLabel: verbName,
//                definition: `Default definition for ${verbName}`
//            };
//        }
//        return verb;
//    }

//    /**
//     * Converts a learning session into xAPI statements
//     * @param session - Learning session to convert
//     * @returns Array of xAPI statements
//     */
//    private convertSessionToStatements(session: LearningSession): XAPIStatement[] {
//        const statements: XAPIStatement[] = [];

//        // Session initialization 

//        statements.push(this.createStatement(
//            session.learner,
//            session.startTime,
//            this.getVerb('initialized')
//        ));

//        // Process each activity and its interactions
//        for (const plannedActivity of session.activities) {
//            for (const interaction of plannedActivity.interactions) {
//                statements.push(this.createStatement(
//                    session.learner,
//                    interaction.timestamp,
//                    this.getVerb(interaction.verb),
//                    plannedActivity.activity,
//                    interaction
//                ));
//            }
//        }

//        try {
//            statements.push(this.createStatement(
//                session.learner,
//                session.endTime,
//                this.getVerb('exited')
//            ));
//        } catch (error) {
//            console.error("Error with exit statement:", error);
//        }

//        return statements;
//    }

//    /**
//     * Creates an individual xAPI statement
//     * @param learner - Student profile
//     * @param verb - Action verb
//     * @param timestamp - Event time
//     * @param activity - Optional learning activity
//     * @param interaction - Optional interaction details
//     * @returns xAPI statement
//     */
//    private createStatement(
//        learner: Learner,
//        timestamp: Date,
//        verb: Verb,
//        activity?: Activity,
//        interaction?: ActivityInteraction
//    ): XAPIStatement {
//        const defaultObject = {
//            id: this.courseStructure?.id || 'https://example.com/default',
//            objectType: 'Activity',
//            definition: {
//                type: 'http://adlnet.gov/expapi/activities/course',
//                name: {
//                    en: this.courseStructure?.title || 'Default Course'
//                },
//                description: {
//                    en: this.courseStructure?.description || ''
//                }
//            }
//        };

//        // Generate result based on interaction or learner profile
//        try {
//            const result = interaction?.result || this.generateResult(verb, learner.profile);
//            const statement: XAPIStatement = {
//                actor: {
//                    mbox: `mailto:${learner.id}@example.com`,
//                },
//                timestamp: timestamp.toISOString(),
//                version: "1.0.0",
//                id: uuidv4(),
//                ...(result && { result }),
//                verb: {
//                    id: verb.id,
//                    display: {
//                        en: verb.prefLabel
//                    }
//                },
//                object: activity ? {
//                    id: activity.href,
//                    definition: {
//                        type: activity.objectType,
//                        name: {
//                            en: activity.title
//                        },
//                        description: activity.description ? {
//                            en: activity.description
//                        } : undefined,
//                        extensions: {
//                            'https://w3id.org/learning-analytics/learning-management-system/external-id': activity.id
//                        }
//                    },
//                    objectType: 'Activity'
//                } : defaultObject,
//                context: {
//                    instructor: {
//                        mbox: `mailto:instructor@example.com`,
//                    },
//                    extensions: {
//                        'https://example.com/activities/extensions/course_id': activity?.id || this.courseStructure?.id || ''
//                    }
//                }
//            };

//            return statement;
//        } catch (error) {
//            console.error('Error in generating statement', error);

//            throw error;
//        }
//    }

//    /**
//     * Generates result data for specific verbs
//     * @param verb - Action verb
//     * @param profile - Learner profile
//     * @returns Result object for xAPI statement
//     */
//    private generateResult(verb: Verb, profile: LearnerProfile): XAPIStatement['result'] | undefined {
//        switch (verb.prefLabel) {
//            case 'prescribed':
//                return {
//                    score: {
//                        min: 0,
//                        max: 9,
//                        scaled: profile.assessmentPerformance
//                    },
//                };
//            case 'scored':
//                return {
//                    score: {
//                        min: 0,
//                        max: 9,
//                        scaled: profile.assessmentPerformance
//                    },
//                };
//            case 'completed':
//                return {
//                    score: {
//                        raw: Math.round(profile.assessmentPerformance * 100),
//                        min: 0,
//                        max: 100,
//                        scaled: profile.assessmentPerformance
//                    },
//                    completion: true,
//                    success: profile.assessmentPerformance >= 0.7
//                };
//            case 'failed':
//                return {
//                    score: {
//                        raw: Math.round(profile.assessmentPerformance * 100),
//                        min: 0,
//                        max: 100,
//                        scaled: profile.assessmentPerformance
//                    },
//                    completion: true,
//                    success: false,
//                    duration: `PT${Math.round(profile.averageSessionDuration)}M`
//                };
//            case 'passed':
//                return {
//                    score: {
//                        raw: Math.round(profile.assessmentPerformance * 100),
//                        min: 0,
//                        max: 100,
//                        scaled: profile.assessmentPerformance
//                    },
//                    completion: true,
//                    success: true,
//                    duration: `PT${Math.round(profile.averageSessionDuration)}M`
//                };
//            case 'rated':
//                const rating = Math.round(profile.engagementLevel * 5);
//                return {
//                    score: {
//                        raw: rating,
//                        min: 1,
//                        max: 5
//                    }
//                };
//            default:
//                return undefined;
//        }
//    }

//    /**
//     * Generates and saves statements for multiple learners over time
//     * @param days - Number of days to simulate
//     * @param onProgress - Progress callback
//     */
//    async generateAndSaveStatements(days: number, onProgress?: (progress: number) => void): Promise<void> {
//        try {
//            if (!this.courseStructure) {
//                await this.initialize();
//            }

//            // Reset statements array
//            this.statements = [];
//            let progressCount = 0;
//            const totalSteps = this.learners.length * days;
//            const now = new Date();

//            for (const learner of this.learners) {
//                let sessionsGenerated = 0;
//                let daysWithSessions = 0;
//                let sessionCount = 0;
//                let sessionStatementCount = 0;

//                for (let month = 0; month < 3; month++) {
//                    for (let week = 0; week < 4; week++) {
//                        const date = new Date(now.getTime());
//                        date.setMonth(now.getMonth() - month);
//                        date.setDate(now.getDate() - (week * 7));

//                        if (Math.random() < learner.profile.sessionsPerWeek / 7) {
//                            const session = this.generateSession(learner, date);
//                            if (session) {
//                                const sessionStatements = this.convertSessionToStatements(session);
//                                this.statements.push(...sessionStatements);
//                                sessionsGenerated++;
//                                daysWithSessions++;
//                                sessionCount++;
//                                sessionStatementCount += sessionStatements.length;
//                            }
//                        }

//                        progressCount++;
//                        if (onProgress) {
//                            onProgress((progressCount / totalSteps) * 100);
//                        }
//                    }
//                }
//                console.log(`Learner ${learner.id} had ${sessionCount} sessions and ${sessionStatementCount} session statements on ${daysWithSessions} out of 12 weeks (3 months).`);

//            }

//            console.log(`Generated ${this.statements.length} statements`);

//            try {
//                // Save all statements in one operation
//                await this.dataService.saveBulkStatements(this.statements);
//                console.log('All statements saved successfully');
//            } catch (error) {
//                console.error('Error saving statements:', error);
//                throw error;
//            }
//        } catch (error) {
//            console.error('Error in generate and save process:', error);
//            throw error;
//        }
//    }

    /**
     * Validates connection to xAPI service
     * @returns Connection status
     */
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