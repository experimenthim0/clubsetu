/**
 * academicConstants.js
 * Centralized definition of academic programs, program durations,
 * and valid branch mappings for CampusNode (Server).
 */

export const PROGRAM_OPTIONS = ["BTECH", "MTECH", "MSC", "MBA", "PHD", "OTHER"];

export const PROGRAM_LABELS = {
  BTECH: "B.Tech",
  MTECH: "M.Tech",
  MSC: "M.Sc",
  MBA: "MBA",
  PHD: "Ph.D",
  OTHER: "Other",
};

export const PROGRAM_BRANCH_MAP = {
  BTECH: {
    label: "B.Tech (4 Years)",
    maxDurationYears: 4,
    branches: ["CSE", "IT", "MNC", "MAC", "ECE", "EE", "ICE", "ME", "CE", "CH", "IPE", "BT", "TT"],
  },
  MTECH: {
    label: "M.Tech (2 Years)",
    maxDurationYears: 2,
    branches: ["CSE", "IT", "MNC", "MAC", "VLSI", "AI", "ECE", "EE", "ICE", "ME", "CE", "CH", "IPE", "BT", "TT", "RE"],
  },
  MSC: {
    label: "M.Sc (2 Years)",
    maxDurationYears: 2,
    branches: ["PH", "CY", "MA"],
  },
  MBA: {
    label: "MBA (2 Years)",
    maxDurationYears: 2,
    branches: ["MB"],
  },
  PHD: {
    label: "Ph.D (5 Years)",
    maxDurationYears: 5,
    branches: ["CSE", "IT", "ECE", "EE", "ICE", "ME", "CE", "CH", "IPE", "BT", "TT", "PH", "CY", "MA", "HUM"],
  },
  OTHER: {
    label: "Other Category (Max 5 Years)",
    maxDurationYears: 5,
    branches: ["GENERAL"],
  },
};

/**
 * Returns array of branch codes allowed for a given program.
 */
export function getBranchesForProgram(program) {
  if (!program || !PROGRAM_BRANCH_MAP[program]) {
    return [];
  }
  return PROGRAM_BRANCH_MAP[program].branches;
}

/**
 * Validates whether a branch code is allowed for a given program.
 */
export function isValidBranchForProgram(program, branchCode) {
  if (!program || !branchCode) return false;
  const branches = getBranchesForProgram(program);
  return branches.includes(branchCode.toUpperCase());
}

/**
 * Returns maximum allowed program duration in years (e.g. 4 for BTech, 5 for PhD/Other, 2 for MTech/MSc/MBA).
 */
export function getMaxDurationForProgram(program) {
  if (!program || !PROGRAM_BRANCH_MAP[program]) return 5;
  return PROGRAM_BRANCH_MAP[program].maxDurationYears;
}

/**
 * Unique list of all distinct branch codes across all programs.
 */
export const ALL_BRANCH_CODES = Array.from(
  new Set(Object.values(PROGRAM_BRANCH_MAP).flatMap((p) => p.branches))
);
