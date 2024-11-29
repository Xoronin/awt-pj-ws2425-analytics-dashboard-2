import { Verb } from "../types/types";


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
     * Stores verbs in a MongoDB database after fetching and transforming json data from URL.
     * @returns A `Promise` that resolves when the data is stored successfully.
     * @throws An error if the data cannot be stored.
     */
    async storeVerbsInMongoDB(verbs: Verb[]): Promise<void> {
        try {

            // First check if data already exists
            const existingdata = await this.getVerbs();
            if (existingdata.length > 0) {
                console.log('verbs already exists in database');
                return;
            }

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