import { LearnerProfile } from '../data/learner-generator';

/**
 * Interface for API response when storing learners
 */
interface StoreLearnerResponse {
    message: string;
    insertedIds?: { [key: number]: string };
    error?: string;
}

/**
 * Service class for managing learner profiles in MongoDB
 * Handles API communication for storing and retrieving learner data
 */
class LearnerService {
    private apiUrl = 'http://localhost:5050/api';

    /**
     * Store multiple learner profiles in the database
     * Clears existing data before inserting new profiles
     * 
     * @param learnerProfiles - Array of learner profiles to store
     * @returns Promise with the storage operation result
     * @throws Error if the API request fails
     */
    public async storeLearnerProfiles(learnerProfiles: LearnerProfile[]): Promise<StoreLearnerResponse> {
        try {
            const response = await fetch(`${this.apiUrl}/learners`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(learnerProfiles)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to store learner profiles');
            }

            return data;
        } catch (error) {
            console.error('error storing lerarners:', error);
            throw error;
        }
    }

    /**
     * Retrieve all learner profiles from the database
     * 
     * @returns Promise with array of learner profiles
     * @throws Error if the API request fails
     */
    public async getLearnerProfiles(): Promise<LearnerProfile[]> {
        try {
            const response = await fetch(`${this.apiUrl}/learners`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to fetch learner profiles');
            }

            return await response.json();
        } catch (error) {
            console.error('error fecthing lerarner profiles:', error);
            throw error;
        }
    }

}

export default LearnerService;