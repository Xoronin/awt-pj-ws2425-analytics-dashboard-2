import { XAPIStatement } from "../types/types";

/**
 * Service for interacting with xAPI statements collection in database
 */
export class XAPIService {
    private apiUrl = 'http://localhost:5050/api';

    /**
     * Saves multiple xAPI statements in bulk
     * @param statements - Array of xAPI statements to save
     * @throws Error if save operation fails
     */
    async saveBulkStatements(statements: XAPIStatement[]): Promise<void> {
        try {
            const response = await fetch(`${this.apiUrl}/statements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(statements)
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error saving statements:', error);
            throw error;
        }
    }

    /**
     * Retrieves all xAPI statements from the LRS
     * @returns Array of stored xAPI statements
     * @throws Error if fetch operation fails
     */
    async getStatements(): Promise<XAPIStatement[]> {
        try {
            const response = await fetch(`${this.apiUrl}/statements`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching statements:', error);
            throw error;
        }
    }
}
