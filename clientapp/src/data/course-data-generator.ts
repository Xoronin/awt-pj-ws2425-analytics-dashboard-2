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

type ActivityId =
    | 'I_A8531FEB' | 'I_3DFBBC79' | 'I_80934D41' | 'I_02429027' | 'I_6FC50F13'
    | 'I_F53A47AD' | 'I_9A5F5D33' | 'I_FD36D805' | 'I_6EED8747' | 'I_018EF56F'
    | 'I_D459AF40' | 'I_0CDA34DA' | 'I_938103FA' | 'I_D48D1B23' | 'I_30C2727A';

// Define the probability mapping with the specific type
const usageProbability: Record<ActivityId, number> = {
    'I_A8531FEB': 0.49,  // Bäume schützen
    'I_3DFBBC79': 0.05,  // Bäume kappen
    'I_80934D41': 0.05,  // Bäume ausdünnen
    'I_02429027': 0.05,  // über Fragen zu Bäumen beraten
    'I_6FC50F13': 0.05,  // Grünpflanzen pflanzen
    'I_F53A47AD': 0.05,  // auf Bäume klettern
    'I_9A5F5D33': 0.05,  // Gefahren im Umgang mit Bäumen mindern
    'I_FD36D805': 0.05,  // Kettensäge bedienen
    'I_6EED8747': 0.05,  // bei der Baumidentifizierung assistieren
    'I_018EF56F': 0.02,  // Baumkonservierung
    'I_D459AF40': 0.02,  // Krankheits- und Schädlingsbekämpfung durchführen
    'I_0CDA34DA': 0.02,  // Baumkrankheiten bekämpfen
    'I_938103FA': 0.02,  // forstwirtschaftliche Ausrüstung instand halten
    'I_D48D1B23': 0.02,  // Sicherheitsverfahren bei der Arbeit in großen Höhen befolgen
    'I_30C2727A': 0.01   // mit Seilausrüstung Bäume erklettern
};


/**
 * Rating Adjustments
 * 
 * This object defines a rating bias for each activity.
 * Higher values (closer to 1.0) = more likely to get better ratings
 * Lower values (closer to 0.0) = more likely to get worse ratings
 */
const ratingAdjustment = {
    'I_A8531FEB': 0.68,  // Bäume schützen
    'I_3DFBBC79': 0.42,  // Bäume kappen
    'I_80934D41': 0.45,  // Bäume ausdünnen
    'I_02429027': 0.63,  // über Fragen zu Bäumen beraten
    'I_6FC50F13': 0.65,  // Grünpflanzen pflanzen
    'I_F53A47AD': 0.38,  // auf Bäume klettern
    'I_9A5F5D33': 0.58,  // Gefahren im Umgang mit Bäumen mindern
    'I_FD36D805': 0.35,  // Kettensäge bedienen
    'I_6EED8747': 0.60,  // bei der Baumidentifizierung assistieren 
    'I_018EF56F': 0.52,  // Baumkonservierung
    'I_D459AF40': 0.43,  // Krankheits- und Schädlingsbekämpfung durchführen 
    'I_0CDA34DA': 0.41,  // Baumkrankheiten bekämpfen 
    'I_938103FA': 0.51,  // forstwirtschaftliche Ausrüstung instand halten 
    'I_D48D1B23': 0.47,  // Sicherheitsverfahren bei der Arbeit in großen Höhen befolgen 
    'I_30C2727A': 0.32   // mit Seilausrüstung Bäume erklettern 
};

/**
 * Service for generating structured course data from XML manifests and LOM metadata
 */
class CourseDataGenerator {
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
    private createActivity(item: Element, xmlDoc: Document, lomData: LomData[]): Activity {
        const activity: Activity = {} as Activity;

        const identifier = item.getAttribute('identifier') || '';
        activity.id = identifier;
        activity.title = this.getTextContent(item.querySelector('title'));

        // Get type and href from XML data 
        const resource = xmlDoc.querySelector(`resource[identifier="${activity.id}"]`);

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

        // map probability for each activity
        activity.probability = (identifier in usageProbability)
            ? usageProbability[identifier as ActivityId]
            : 0.01;

        // map rating adjustment for each activity
        activity.rating = (identifier in ratingAdjustment)
            ? ratingAdjustment[identifier as ActivityId]
            : 0.5;

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
            case 'very low':
                return 0.2;
            case 'low':
                return 0.4;
            case 'medium':
                return 0.6;
            case 'high':
                return 0.8;
            case 'very high':
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
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 15;

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

    /**
     * Loads xAPI profile templates and maps verbs to activity types.
     * @returns Promise that resolves when templates are loaded
     * @throws Error if profile loading fails
    */
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
     * Loads and processes verbs from XAPI profile
     * @returns Promise resolving to array of Verb objects
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
     * Fetches and parses multiple LOM XML files.
     * @returns An array of LomData objects.
     */
    async loadLOM(): Promise<LomData[]> {
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
     * Parses a Learning Object Metadata (LOM) XML document into a structured LomData object.
     * @param parsedXml - The parsed XML document.
     * @returns A structured LomData object with general, educational, and classification data.
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
