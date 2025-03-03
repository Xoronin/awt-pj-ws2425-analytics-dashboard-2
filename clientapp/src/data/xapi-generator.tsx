import { v4 as uuidv4 } from 'uuid';
import LearnerGenerator from './learner-generator';
import CourseDataGenerator from './course-data-generator';
import LearningSessionGenerator from './session-generator';
import { XAPIService } from '../services/xapi-service';
import VerbService from '../services/verb-service';
import LearnerService from '../services/learner-service';
import { CourseData, Verb, LearnerProfile, XAPIStatement, LearningSession, LearningInteraction, Activity } from '../types/types';

/**
 * Generates xAPI statements from simulated learning sessions and learner profiles
 */
class XAPIGenerator {
    private courseData: CourseData;
    private verbs: Verb[];
    private learners: LearnerProfile[] = [];
    private statements: XAPIStatement[] = [];
    private dataService: XAPIService;
    private sessionGenerator!: LearningSessionGenerator;

    constructor(courseData: CourseData, verbs: Verb[], learners: LearnerProfile[]) {
        this.dataService = new XAPIService();
        this.courseData = courseData;
        this.verbs = verbs;
        this.learners = learners;
    }

    /**
     * Generates and saves xAPI statements for multiple learners over a given time period.
     * @param totalLearners - The total number of learners to generate statements for.
     * @param numberOfWeeks - The number of weeks to simulate.
     * @returns A Promise that resolves when all statements have been generated and saved.
     */
    async generateAndSaveStatements(totalLearners: number, numberOfWeeks: number): Promise<{
        sessions: Map<string, LearningSession[]>;
        statements: XAPIStatement[];
    }> {
        try {

            // 1. Initialize data
            this.sessionGenerator = new LearningSessionGenerator(this.courseData, numberOfWeeks, this.verbs,);

            // 2. Set course start date (e.g., 2 weeks from now)
            const courseStartDate = new Date(2024, 5, 27);
            courseStartDate.setDate(courseStartDate.getDate() + 14);

            const sessions = await this.generateAllSessions(courseStartDate);
            const allLearningSessions = Array.from(sessions.values()).flatMap((sessions) => sessions);

            this.statements = [];
            let progressCount = 0;
            const totalSteps = allLearningSessions.length;

            allLearningSessions.forEach((session) => {

                // Process each activity and its events
                for (const activity of session.activities) {
                    for (const event of activity.interactions) {
                        this.statements.push(this.createStatement(
                            session.learner,
                            event.timestamp,
                            event.verb,
                            event,
                            activity.activity
                        ));
                    }
                }
                progressCount++;
            });

            try {
                // Save all statements in one operation
                await this.dataService.saveBulkStatements(this.statements);

                console.log('All statements saved successfully');

                //this.printStatementsStatistics(sessions);

                return {
                    sessions,
                    statements: this.statements
                };
            } catch (error) {
                console.error('Error saving statements:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error in generate and save process:', error);
            throw error;
        }
    }

    /**
     * Generates learning sessions for all learners and returns them grouped by learner ID.
     * @param courseStartDate - The start date of the course.
     * @returns A Map of learner IDs to their corresponding learning sessions.
     */
    async generateAllSessions(courseStartDate: Date) {
        try {
            // Generate sessions for each learner
            const allSessions = new Map<string, LearningSession[]>();

            for (const learner of this.learners) {
                const learnerSessions = this.sessionGenerator.generateLearnerSessions(
                    learner,
                    courseStartDate
                );

                allSessions.set(learner.id, learnerSessions);
            }

            return allSessions;

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Failed to generate sessions:', errorMessage);
            throw new Error(`Session generation failed: ${errorMessage}`);
        }
    }

    /**
     * Creates an individual xAPI statement based on the provided learner, timestamp, verb, interaction, and activity.
     * @param learner - The learner profile.
     * @param timestamp - The timestamp of the event.
     * @param verb - The verb associated with the event.
     * @param interaction - The details of the learning interaction.
     * @param activity - The learning activity associated with the event.
     * @returns The generated xAPI statement.
     */
    private createStatement(
        learner: LearnerProfile,
        timestamp: Date,
        verb: Verb,
        interaction: LearningInteraction,
        activity: Activity,
    ): XAPIStatement {


        // Generate result based on interaction or learner profile
        try {
            const result = interaction.result;
            const statement: XAPIStatement = {
                actor: {
                    mbox: learner.email,
                },
                timestamp: timestamp.toJSON(),
                version: "1.0.0",
                id: uuidv4(),
                ...(result && { result }),
                verb: {
                    id: verb.id,
                    display: {
                        en: verb.prefLabel
                    }
                },
                object: {
                    id: activity.href,
                    definition: {
                        type: activity.objectType,
                        name: {
                            en: activity.title
                        },
                        description: {
                            en: activity.description
                        },
                        extensions: {
                            'https://w3id.org/learning-analytics/learning-management-system/external-id': activity.id
                        }
                    },
                    objectType: 'Activity'
                },
                context: {
                    instructor: {
                        mbox: `mailto:instructor@example.com`,
                    },
                    extensions: {
                        'https://example.com/activities/extensions/course_id': activity?.id
                    }
                }
            };

            return statement;
        } catch (error) {
            console.error('Error in generating statement', error);

            throw error;
        }
    }
}

export default XAPIGenerator;