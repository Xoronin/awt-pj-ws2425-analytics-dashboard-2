
export interface Verb {
    id: string;
    type: string;
    prefLabel: string;
    definition: string;
}

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
 * Service for interacting with LOM collection in database
 */
class VerbService {

    private apiUrl = 'http://localhost:5050/api';

    /**
 * Loads and processes course data from XML manifest
 * @returns Promise resolving to structured course data
 */
    private async loadVerbs(): Promise<Verb[]> {
        try {
            const response = await fetch('https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/xapi/xapi_profiles.json')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const json = await response.json();
            const verbs = this.parseVerbs(json);
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
     * Stores verbs in a MongoDB database after fetching and transforming json data from URL.
     * @returns A `Promise` that resolves when the data is stored successfully.
     * @throws An error if the data cannot be stored.
     */
    async storeVerbsInMongoDB(): Promise<void> {
        try {

            // First check if data already exists
            //const existingdata = await this.getVerbs();
            //if (existingdata.length > 0) {
            //    console.log('verbs already exists in database');
            //    return;
            //}

            const verbs = await this.loadVerbs()

            // Store in MongoDB
            const response = await fetch(`${this.apiUrl}/verbs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(verbs)
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
            }

            const result = await response.json();
            console.log(result.message);
        } catch (error) {
            console.error('Error storing verbs:', error);
            throw error;
        }
    }

    /**
     * Fetches verbs from the MongoDB database.
     * @returns A `Promise` that resolves to an array of `Verbs`.
     * @throws An error if the data cannot be retrieved.
     */
    async getVerbs(): Promise<Verb[]> {
        try {
            const response = await fetch(`${this.apiUrl}/verbs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching verbs:', error);
            throw error;
        }
    }
}

export default VerbService