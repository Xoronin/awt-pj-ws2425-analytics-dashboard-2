
/**
 * Represents a standardized xAPI statement for tracking learning activities.
 * Follows the xAPI specification format for learning experience tracking.
 */
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
 * Represents a contiguous period of learning activity by a single learner.
 * Tracks the complete timeline of activities and interactions within the session.
 */
export interface LearningSession {
    learner: LearnerProfile;
    activities: SessionActivity[];
    startTime: Date;
    endTime: Date;
    totalDuration: number;
}

/**
 * Represents a specific learning activity undertaken within a session.
 * Tracks detailed information about the learner's interaction with the activity.
 */
export interface SessionActivity {
    activity: Activity;
    startTime: Date;
    endTime: Date;
    duration: number;
    completed: boolean;
    interactions: LearningInteraction[];
}

/**
 * Represents a learner's characteristics and performance metrics.
 * Used for analyzing learning patterns and personalizing content.
 */
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

/**
 * Represents a learning activity with its metadata and characteristics.
 * Contains information about the activity's content and expected interaction patterns.
 */
export interface Activity {
    id: string;
    title: string;
    difficulty: number;
    interactivityType: string;
    interactivityLevel: string;
    semanticDensity: string;
    typicalLearningTime: string;
    estimatedDuration: number;
    description: string;
    learningResourceType: string;
    href: string;
    objectType: string;
    probability: number;
}

/**
 * Represents a structured section within a course.
 * Groups related learning activities together.
 */
export interface CourseSection {
    title: string;
    activities: Activity[];
}

/**
 * Represents the complete structure and metadata of a course.
 * Defines the organization and sequencing of learning activities.
 */
export interface CourseData {
    id: string;
    title: string;
    description: string;
    sections: CourseSection[];
    defaultObject?: {
        id: string;
        objectType: string;
        definition?: {
            type: string;
            name: {
                en: string;
            };
        };
    };
}

/**
 * Represents a template for creating standardized xAPI statements.
 * Defines the structure and rules for tracking specific types of learning interactions.
 */
export interface XAPITemplate {
    id: string;
    type: string;
    inScheme: string;
    prefLabel: {
        en: string;
    };
    definition: {
        en: string;
    };
    verb: string;
    objectActivityType: string;
    contextExtension?: string[];
    rules?: Array<{
        location: string;
        presence: string;
    }>;
}

/**
 * Represents an xAPI verb defining a learning action.
 * Used to standardize the description of learning interactions.
 */
export interface Verb {
    id: string;
    type: string;
    prefLabel: string;
    definition: string;
}

/**
 * Represents IEEE Learning Object Metadata (LOM) for an educational resource.
 * Provides standardized descriptive data about learning objects.
 */
export interface LomData {
    general: {
        identifier: {
            entry: string;
        };
        title: {
            string: {
                _: string;
            };
        };
        description: {
            string: {
                _: string;
            };
        };
    };
    educational: {
        difficulty: {
            value: string;
        };
        interactivityType: {
            value: string;
        };
        learningResourceType: {
            value: string;
        };
        interactivityLevel: {
            value: string;
        };
        semanticDensity: {
            value: string;
        };
        typicalLearningTime: {
            duration: string;
        };
    };
    classification: {
        taxonPath: {
            taxon: {
                entry: {
                    string: {
                        _: string;
                    };
                };
            };
        };
    };
}

/**
 * Represents a single interaction between a learner and a learning activity.
 * Records the specific action taken and any results or outcomes.
 */
export interface LearningInteraction {
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