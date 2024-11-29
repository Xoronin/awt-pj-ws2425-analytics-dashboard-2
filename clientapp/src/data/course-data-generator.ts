import LOMDataService from "../services/lom-service";
import VerbService from "../services/verb-service";
import { XMLParser } from 'fast-xml-parser';
import { CourseData, Verb, Activity, LomData, CourseSection, XAPITemplate } from '../types/types';


export const usedVerbs = [
    'prescribed',
    'scored',
    'initialized',
    'exited',
    'completed',
    'achieved',
    'failed',
    'passed',
    'rated',
    'searched',
    'progressed',
    'launched'
];


/**
 * Service for generating structured course data from XML manifests and LOM metadata
 */
class CourseDataGenerator{
    private lomDataService = new LOMDataService();
    private verbService = new VerbService();
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
    async loadCourseData(): Promise<CourseData> {
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

            const courseStructure: CourseData = {
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

    /**
     * Loads and processes course data from XML manifest
     * @returns Promise resolving to structured course data
     */
    async loadVerbs(): Promise<Verb[]> {
        try {
            const response = await fetch('https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/xapi/xapi_profiles.json')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const json = await response.json();
            const verbs = this.parseVerbs(json);
            await this.verbService.storeVerbsInMongoDB(verbs);

            return verbs;
        } catch (error) {
            console.error('Error loading verbs:', error);
            throw error;
        }
    }

    /**
     * Parse verbs from XAPI profile and filter to required ones
     */
    private parseVerbs(profileJson: any): Verb[] {
        const verbs: Verb[] = [];

        profileJson.concepts.forEach((concept: any) => {
            if (concept.type === 'Verb') {
                const verbName = concept.prefLabel.en;
                if (usedVerbs.includes(verbName)) {
                    verbs.push({
                        id: concept.id,
                        type: concept.type,
                        prefLabel: verbName,
                        definition: concept.definition.en
                    });
                }
            }
        });

        return verbs;
    }

    /**
     * Parses an XML string into a JavaScript object using `fast-xml-parser`.
     * @param xmlText - The XML string to be parsed.
     * @returns A parsed JavaScript object representing the XML structure.
     */
    parseLOMXMLString(xmlText: string): any {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            textNodeName: "value",
            parseAttributeValue: true,
            removeNSPrefix: true,
            parseTagValue: true,
            trimValues: true
        });
        return parser.parse(xmlText);
    }

    /**
     * Transforms a parsed XML object into a structured `LomData` object.
     * @param parsedXml - The parsed XML object.
     * @returns A `LomData` object or `null` if the XML structure is invalid.
     */
    async loadLOM(parsedXml: any): Promise<LomData[]> {
        try {
            const manifestUrls = [
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/11.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/04.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/07.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/09.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/06.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/03.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/10.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/05.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/08.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/01.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/02.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/15.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/14.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/12.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/13.xml"
            ];

            // Fetch and transform data
            const responses = await Promise.all(
                manifestUrls.map(url =>
                    fetch(url)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.text();
                        })
                )
            );

            const lomData = await Promise.all(
                responses.map(async xmlText => {
                    const parsedData = await this.parseXMLString(xmlText);
                    return this.parseLOM(parsedData);
                })
            );

            return lomData
        } catch (error) {
            console.error('Error loading lom:', error);
            throw error;
        }
    }


    /**
     * Parse LOM from LOM files
     */
    private parseLOM(parsedXml: any): LomData {
        const lomData: LomData = {
            general: {
                identifier: {
                    entry: this.extractValue(parsedXml.lom, 'general.identifier.entry')
                },
                title: {
                    string: {
                        _: this.extractValue(parsedXml.lom, 'general.title.string.value')
                    }
                },
                description: {
                    string: {
                        _: this.extractValue(parsedXml.lom, 'general.description.string.value')
                    }
                }
            },
            educational: {
                difficulty: {
                    value: this.extractValue(parsedXml.lom, 'educational.difficulty.value') || 'medium'
                },
                interactivityType: {
                    value: this.extractValue(parsedXml.lom, 'educational.interactivityType.value')
                },
                learningResourceType: {
                    value: this.extractValue(parsedXml.lom, 'educational.learningResourceType.value')
                },
                interactivityLevel: {
                    value: this.extractValue(parsedXml.lom, 'educational.interactivityLevel.value')
                },
                semanticDensity: {
                    value: this.extractValue(parsedXml.lom, 'educational.semanticDensity.value')
                },
                typicalLearningTime: {
                    duration: 'PT30M0S' //this.extractValue(parsedXml.lom, 'educational.typicalLearningTime.duration')
                }
            },
            classification: {
                taxonPath: {
                    taxon: {
                        entry: {
                            string: {
                                _: this.extractValue(parsedXml.lom, 'classification.taxonPath.taxon.entry.string.value')
                            }
                        }
                    }
                }
            }
        };

        return lomData;
    }

    /**
     * Extracts a value from a nested object using a dot-separated path.
     * @param obj - The object to extract the value from.
     * @param path - The dot-separated path to the desired value.
     * @returns The extracted value or `null` if the path is invalid.
     */
    private extractValue(obj: any, path: string) {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (!current[key]) return null;
            current = current[key];
        }

        // If the target is an object with nested "value", return its text
        if (current[0].value) {
            return current[0].value;
        }
        return current._ || current;
    }

}

export default CourseDataGenerator;
