import api from '../services/api';

export const CLUB_EVENT_EXPORT_COLUMNS = [
  { key: 'eventName', label: 'Event Name', getValue: event => event.eventName },
  { key: 'clubName', label: 'Club Name', getValue: event => event.clubName },
  { key: 'totalRegistrations', label: 'Registrations', getValue: event => event.totalRegistrations },
  { key: 'eventDate', label: 'Event Date', getValue: event => event.eventDate },
  { key: 'totalAmountReceived', label: 'Amount Received (₹)', getValue: event => event.totalAmountReceived },
];

/**
 * Download the same club event summary used by the Club Events page.
 * Returns false when the endpoint has no rows so callers can show their
 * existing empty-state notification.
 */
export async function downloadClubEventExport(clubId, filters = {}, selectedColumnKeys = CLUB_EVENT_EXPORT_COLUMNS.map(column => column.key)) {
  if (!clubId) return false;

  const query = new URLSearchParams(filters).toString();
  const response = await api.get(`/api/events/club-manage/${clubId}/export?${query}`);
  const exportData = response.data?.events || [];
  if (exportData.length === 0) return false;

  const columns = CLUB_EVENT_EXPORT_COLUMNS.filter(column => selectedColumnKeys.includes(column.key));
  const headers = columns.map(column => column.label);
  const rows = exportData.map(event => columns.map(column => {
    const value = column.getValue(event);
    if (value === null || value === undefined) return '';
    if (column.key === 'eventDate') return new Date(value).toLocaleDateString();
    if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
    return value;
  }));
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `club_events_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
