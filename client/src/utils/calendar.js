export const generateGoogleCalendarLink = (event) => {
    const { title, description, location, startTime, endTime } = event;
    const start = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = endTime ? new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, '') : new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', title || '');
    url.searchParams.append('details', description || '');
    url.searchParams.append('location', location || '');
    url.searchParams.append('dates', `${start}/${end}`);
    return url.toString();
};

export const generateICSFile = (event) => {
    const { title, description, location, startTime, endTime } = event;
    const start = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = endTime ? new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, '') : new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${title || ''}`,
        `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
        `LOCATION:${location || ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
};

export const downloadICS = (event) => {
    const uri = generateICSFile(event);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `${(event.title || 'event').replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
