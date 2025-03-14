/**
 * Parses an ISO 8601 duration string (PT format) into minutes.
 * @param {string | null} duration - Duration string in PT format (e.g., "PT1H30M15S") or null
 * @returns {number} - Number of minutes, defaults to 15 if input is null or invalid
 */
export const ParseDuration = (duration: string | null): number => {
    if (!duration) return 15;

    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return 15;

    const [, hours, minutes, seconds] = matches;
    return (
        (parseInt(hours || '0') * 60) + parseInt(minutes || '0') + Math.ceil(parseInt(seconds || '0') / 60)
    );
};