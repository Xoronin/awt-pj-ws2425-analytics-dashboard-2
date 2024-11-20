import LOMDataService, { LomData } from "../services/lom-service";

export interface Activity {
    id: string;
    title: string;
    difficulty: number;
    interactivityType: string;
    interactivityLevel: string;
    semanticDensity: string;
    typicalLearningTime: string;
    estimatedDuration: number;
    href?: string;
    description?: string;
    type?: string;
    learningResourceType?: string;
    competencies?: string[];
    verb?: string;
}

export interface CourseSection {
    title: string;
    activities: Activity[];
}

export interface CourseStructure {
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

export const verbs = {
    prescribed: 'https://w3id.org/xapi/dod-isd/verbs/prescribed',
    scored: 'http://adlnet.gov/expapi/verbs/scored',
    initialized: 'http://adlnet.gov/expapi/verbs/initialized',
    exited: 'http://adlnet.gov/expapi/verbs/exited',
    completed: 'http://adlnet.gov/expapi/verbs/completed',
    achieved: 'https://w3id.org/xapi/dod-isd/verbs/achieved',
    failed: 'http://adlnet.gov/expapi/verbs/failed',
    passed: 'http://adlnet.gov/expapi/verbs/passed',
    rated: 'http://id.tincanapi.com/verb/rated',
    searched: 'https://w3id.org/xapi/acrossx/verbs/searched',
    progressed: 'http://adlnet.gov/expapi/verbs/progressed',
    launched: 'http://adlnet.gov/expapi/verbs/launched'
};

/**
 * Service for generating structured course data from XML manifests and LOM metadata
 */
class CourseDataGenerator{
    private lomDataService = new LOMDataService();

    /**
     * Parses an XML string into a DOM Document
     * @param xmlString - The XML content to parse
     * @returns Parsed XML Document
     */
    parseXMLString(xmlString: string): Document {
        const parser = new DOMParser();
        return parser.parseFromString(xmlString, 'application/xml');
    }

    /**
     * Safely extracts text content from an XML element
     * @param element - The XML element to extract text from
     * @returns Trimmed text content or empty string
     */
    getTextContent(element: Element | null): string {
        return element?.textContent?.trim() || '';
    }

    /**
     * Creates an Activity object from XML item element and LOM metadata
     * @param item - XML item element containing activity data
     * @param xmlDoc - The complete XML document
     * @param lomData - Array of LOM metadata objects
     * @returns Activity object with combined data
     */
    createActivity(item: Element, xmlDoc: Document, lomData: LomData[]): Activity {
        const id = item.getAttribute('identifierref') || '';
        const title = this.getTextContent(item.querySelector('title'));

        // Find corresponding resource
        const resource = xmlDoc.querySelector(`resource[identifier="${id}"]`);
        const href = resource?.querySelector('file')?.getAttribute('href') || undefined;
        const type = resource?.getAttribute('type') || undefined;

        // Find matching LOM data
        const matchingLOM = lomData.find(lom => {
            const activityName = lom.classification.taxonPath.taxon.entry.string._;
            return (
                activityName === title
            );
        });

        // Create base activity with default values
        const baseActivity: Activity = {
            id,
            title,
            difficulty: this.calculateDifficulty(title),
            interactivityType: 'mixed',
            interactivityLevel: 'medium',
            semanticDensity: 'medium',
            typicalLearningTime: 'PT15M',
            estimatedDuration: 15,
            ...(href && { href }),
            ...(type && { type })
        };

        // If no matching LOM found, return base activity
        if (!matchingLOM) {
            console.log(`No matching LOM found for activity ${id}`);
            return baseActivity;
        }

        // Return activity with LOM data
        return {
            ...baseActivity,
            difficulty: this.mapLOMDifficultyToNumber(matchingLOM.educational.difficulty.value),
            interactivityType: matchingLOM.educational.interactivityType.value || baseActivity.interactivityType,
            interactivityLevel: matchingLOM.educational.interactivityLevel.value || baseActivity.interactivityLevel,
            semanticDensity: matchingLOM.educational.semanticDensity.value || baseActivity.semanticDensity,
            typicalLearningTime: matchingLOM.educational.typicalLearningTime.duration || baseActivity.typicalLearningTime,
            estimatedDuration: this.parseTypicalLearningTime(
                matchingLOM.educational.typicalLearningTime.duration
            ) || baseActivity.estimatedDuration,
            learningResourceType: matchingLOM.educational.learningResourceType.value
        };
    }

    /**
     * Maps LOM difficulty strings to numerical values
     * @param difficulty - LOM difficulty string
     * @returns Normalized difficulty value between 0 and 1
     */
    private mapLOMDifficultyToNumber(difficulty: string): number {
        switch (difficulty.toLowerCase()) {
            case 'very easy':
                return 0.2;
            case 'easy':
                return 0.4;
            case 'medium':
                return 0.6;
            case 'difficult':
                return 0.8;
            case 'very difficult':
                return 1.0;
            default:
                return 0.5;
        }
    }

    /**
    * Parses ISO 8601 duration format into minutes
    * @param duration - ISO 8601 duration string (e.g., "PT1H30M")
    * @returns Total duration in minutes
    */
    private parseTypicalLearningTime(duration: string): number {
        // Parse ISO 8601 duration format (e.g., "PT1H30M" or "PT45M")
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 15; // default to 15 minutes

        const [, hours, minutes, seconds] = matches;
        return (
            (parseInt(hours || '0') * 60) +
            parseInt(minutes || '0') +
            Math.ceil(parseInt(seconds || '0') / 60)
        );
    }

    /**
     * Loads and processes course data from XML manifest
     * @returns Promise resolving to structured course data
     */
    async loadCourseData(): Promise<CourseStructure> {
        try {
            const response = await fetch('https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/course/imsmanifest.xml');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const xmlText = await response.text();
            const xmlDoc = this.parseXMLString(xmlText);

            // Get manifest identifier
            const manifest = xmlDoc.documentElement;
            const manifestId = manifest.getAttribute('identifier') || '';

            // Get title and description
            const titleElement = xmlDoc.querySelector('lomimscc\\:title lomimscc\\:string, title string');
            const descriptionElement = xmlDoc.querySelector('lomimscc\\:description lomimscc\\:string, description string');

            const courseStructure: CourseStructure = {
                id: manifestId,
                title: this.getTextContent(titleElement),
                description: this.getTextContent(descriptionElement),
                sections: []
            };

            // Get organization structure
            const organization = xmlDoc.querySelector('organization');
            const rootItems = organization?.querySelector('item')?.querySelectorAll(':scope > item');
            const lomData = await this.lomDataService.getLomData();

            if (rootItems) {
                const sections: CourseSection[] = Array.from(rootItems).map(section => {
                    const sectionTitle = this.getTextContent(section.querySelector('title'));
                    const activities = Array.from(section.querySelectorAll('item[identifierref]'))
                        .map(item => this.createActivity(item, xmlDoc, lomData));

                    return {
                        title: sectionTitle,
                        activities
                    };
                });

                courseStructure.sections = sections;
            }

            return courseStructure;
        } catch (error) {
            console.error('Error loading course data:', error);
            throw error;
        }
    }

    /**
     * Calculates activity difficulty based on title keywords
     * @param title - Activity title
     * @returns Difficulty value between 0 and 1
     */
    calculateDifficulty(title: string): number {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('grundlagen')) {
            return 0.3;
        }
        if (lowerTitle.includes('klettern')) {
            return 0.7;
        }
        if (lowerTitle.includes('krankheit') || lowerTitle.includes('gefahr')) {
            return 0.6;
        }
        if (lowerTitle.includes('identifizierung') || lowerTitle.includes('beraten')) {
            return 0.4;
        }
        return 0.5;
    }

}

export default CourseDataGenerator;
