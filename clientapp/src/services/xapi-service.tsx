import { XAPIStatement } from '../data/xapi-generator';

export class XAPIDataService {
    private apiUrl = 'http://localhost:5050/api';


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
