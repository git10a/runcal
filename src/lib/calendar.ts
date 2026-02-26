export interface CalendarEvent {
    title: string;
    startDate: string; // YYYY-MM-DD or timeframe
    endDate?: string;
    description?: string;
    location?: string;
}

export function generateGoogleCalendarUrl({
    title,
    startDate,
    endDate,
    description = '',
    location = '',
}: CalendarEvent): string {
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';

    // Extract strict YYYY-MM-DD from any date string
    const extractDateRegex = /(\d{4})[-\/年]?(\d{1,2})[-\/月]?(\d{1,2})/;

    const getCleanDateStr = (rawDate: string) => {
        const match = rawDate.match(extractDateRegex);
        if (match) {
            const [, y, m, d] = match;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return rawDate.split(' ')[0].split('T')[0];
    };

    const formatAllDayDate = (cleanDate: string) => {
        return cleanDate.replace(/-/g, '');
    };

    const cleanStartStr = getCleanDateStr(startDate);
    const start = formatAllDayDate(cleanStartStr);

    let end = start;
    if (endDate) {
        const cleanEndStr = getCleanDateStr(endDate);
        const endDateObj = new Date(cleanEndStr);
        if (!isNaN(endDateObj.getTime())) {
            endDateObj.setDate(endDateObj.getDate() + 1);
            end = formatAllDayDate(endDateObj.toISOString().split('T')[0]);
        }
    } else {
        // For a single day event, end date is start date + 1 day
        const startDateObj = new Date(cleanStartStr);
        if (!isNaN(startDateObj.getTime())) {
            startDateObj.setDate(startDateObj.getDate() + 1);
            end = formatAllDayDate(startDateObj.toISOString().split('T')[0]);
        }
    }

    const dates = `${start}/${end}`;

    const params = new URLSearchParams({
        text: title,
        dates: dates,
        details: description,
        location: location,
    });

    return `${baseUrl}&${params.toString()}`;
}
