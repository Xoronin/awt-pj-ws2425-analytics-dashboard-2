import LOMDataService, { LomData } from "../services/lom-service";
import { Verb } from "../services/verb-service";

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
 * Service for generating structured course data from XML manifests and LOM metadata
 */
class CourseDataGenerator{
    private lomDataService = new LOMDataService();
    private templates: Map<string, any>;
    private verbToActivityType: Map<string, string>;

    constructor() {
        this.templates = new Map();
        this.verbToActivityType = new Map();
    }

    /**
     * Parses an XML string into a DOM Document
     * @param xmlString - The XML content to parse
     * @returns Parsed XML Document
     */
    private parseXMLString(xmlString: string): Document {
        const parser = new DOMParser();
        return parser.parseFromString(xmlString, 'application/xml');
    }

    /**
     * Safely extracts text content from an XML element
     * @param element - The XML element to extract text from
     * @returns Trimmed text content or empty string
     */
    private getTextContent(element: Element | null): string {
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
        const activity: Activity = {} as Activity;

        activity.id = item.getAttribute('identifierref') || '';
        activity.title = this.getTextContent(item.querySelector('title'));

        // Get type and href from XML data 
        const resource = xmlDoc.querySelector(`resource[identifier="${activity.id}"]`);
        //const type = resource?.getAttribute('type');
        //if (type !== null && type !== undefined) {
        //    activity.type = type;
        //}
        const href = resource?.querySelector('file')?.getAttribute('href');
        if (href !== null && href !== undefined) {
            activity.href = href;
        }

        // Find matching LOM data
        const matchingLOM = lomData.find(lom => {
            const activityName = lom.classification.taxonPath.taxon.entry.string._;
            return (
                activityName === activity.title
            );
        });

        // Fill activity data from LOM
        if (matchingLOM) {
            activity.difficulty = this.mapLOMDifficultyToNumber(matchingLOM.educational.difficulty.value);
            activity.interactivityType = matchingLOM.educational.interactivityType.value;
            activity.interactivityLevel = matchingLOM.educational.interactivityLevel.value;
            activity.semanticDensity = matchingLOM.educational.semanticDensity.value;
            activity.typicalLearningTime = matchingLOM.educational.typicalLearningTime.duration;
            activity.estimatedDuration = this.parseTypicalLearningTime(matchingLOM.educational.typicalLearningTime.duration);
            activity.learningResourceType = matchingLOM.educational.learningResourceType.value;
            activity.description = '';
        };

        // Set objectType from templates
        activity.objectType = item.getAttribute('type') && this.verbToActivityType.get(item.getAttribute('type') || '') ?
                this.verbToActivityType.get(item.getAttribute('type') || '') || '' :
                'http://adlnet.gov/expapi/activities/course'

        // Return activity with LOM data
        return activity;
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
            await this.loadxApiProfileTemplates();

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

    private async loadxApiProfileTemplates(): Promise<void> {
        try {
            const profile = await fetch('https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/xapi/xapi_profiles.json').then(r => r.json());
            profile.templates.forEach((template: XAPITemplate) => {
                this.verbToActivityType.set(
                    template.verb.split('/').pop() || '',
                    template.objectActivityType
                );
            });
        } catch (error) {
            console.error('Error loading xAPI profile:', error);
            throw error;
        }
    }

    /**
     * Calculates activity difficulty based on title keywords
     * @param title - Activity title
     * @returns Difficulty value between 0 and 1
     */
    //private calculateDifficulty(title: string): number {
    //    const lowerTitle = title.toLowerCase();
    //    if (lowerTitle.includes('grundlagen')) {
    //        return 0.3;
    //    }
    //    if (lowerTitle.includes('klettern')) {
    //        return 0.7;
    //    }
    //    if (lowerTitle.includes('krankheit') || lowerTitle.includes('gefahr')) {
    //        return 0.6;
    //    }
    //    if (lowerTitle.includes('identifizierung') || lowerTitle.includes('beraten')) {
    //        return 0.4;
    //    }
    //    return 0.5;
    //}


}

export default CourseDataGenerator;
