
/**
*  Helper class with usefull utility functions
*/
class Utility {
    constructor() { }

    /**
    * Utility function to pick a random item from an array.
    */
    randomChoice<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Utility function to generate a random integer between a range.
     */
    randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Utility function to generate a random time for a date.
     */
    generateRandomTimeForDate(date: Date): Date {
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        return new Date(date.setHours(hour, minute, 0, 0));
    }

    /**
     * Utility function to add minutes.
     */
    addMinutes(date: Date, minutes: number): Date {
        return new Date(date.getTime() + minutes * 60000);
    }

    // Utility function to generate random float
    randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }
}

export default Utility;