/**
 * academicYear.js
 * Utility helper functions for calculating student Academic Year (1st Year, 2nd Year, etc.)
 * from Graduation Year.
 */

/**
 * Calculates academic year string based on graduation year.
 * @param {string|number} gradYear - e.g. 2028 or "2028"
 * @returns {string} - e.g. "3rd Year", "4th Year", "Graduated"
 */
export function calculateYearFromGraduation(gradYear) {
  if (!gradYear) return '';
  const gYear = parseInt(gradYear, 10);
  if (isNaN(gYear)) return gradYear;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1 to 12

  // In Indian & global universities, academic sessions start around July (Month 7).
  // E.g. in Aug 2026:
  // Batch graduating in 2030 -> 1st Year (2026-2030)
  // Batch graduating in 2029 -> 2nd Year (2025-2029)
  // Batch graduating in 2028 -> 3rd Year (2024-2028)
  // Batch graduating in 2027 -> 4th Year (2023-2027)
  // Batch graduating in 2026 or earlier -> Graduated
  const sessionStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
  const yearsRemaining = gYear - sessionStartYear;

  if (yearsRemaining <= 0) return 'Graduated';
  if (yearsRemaining === 1) return '4th Year';
  if (yearsRemaining === 2) return '3rd Year';
  if (yearsRemaining === 3) return '2nd Year';
  if (yearsRemaining === 4) return '1st Year';
  return `${yearsRemaining}th Year`;
}

/**
 * Generates options for graduation year dropdowns with calculated academic year labels.
 * @returns {Array<{ gradYear: string, label: string, academicYear: string }>}
 */
export function getGraduationYearOptions() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const sessionStart = currentMonth >= 7 ? currentYear : currentYear - 1;

  const options = [];
  // Generates options for batches from current year down to +5 years out
  for (let y = sessionStart + 4; y >= sessionStart; y--) {
    const calcYear = calculateYearFromGraduation(y);
    options.push({
      gradYear: y.toString(),
      label: `${y} (${calcYear})`,
      academicYear: calcYear
    });
  }
  return options;
}
