import { LomData } from '../types/types';


/**
 * Service for interacting with LOM collection in database
 */
class LOMDataService {

    private apiUrl = 'http://localhost:5050/api';

    /**
     * Stores LOM data in a MongoDB database after fetching and transforming XML metadata from URLs.
     * @returns A `Promise` that resolves when the data is stored successfully.
     * @throws An error if the data cannot be stored.
     */
    async storeLomDataInMongoDB(lomData: LomData[]): Promise<void> {

        try
        {
            // First check if data already exists
            const existingdata = await this.getLomData();
            if (existingdata.length > 0) {
                console.log('lom data already exists in database');
                return;
            }

            // Store in MongoDB
            const response = await fetch(`${this.apiUrl}/lom`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lomData)
            });
            console.log(`Stored ${lomData.length} LOM data documents in database`);

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
            }

            const result = await response.json();
            console.log(result.message);
        } catch (error) {
            console.error('Error storing LOM data:', error);
            throw error;
        }
    }

    /**
     * Fetches LOM data from the MongoDB database.
     * @returns A `Promise` that resolves to an array of `LomData`.
     * @throws An error if the data cannot be retrieved.
     */
    async getLomData(): Promise<LomData[]> {
        try {
            const response = await fetch(`${this.apiUrl}/lom`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching LOM:', error);
            throw error;
        }
    }
}

export default LOMDataService