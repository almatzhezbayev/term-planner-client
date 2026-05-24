export interface ParsedTranscript {
  school: string;
  major: string;
  admitTerm: string;
  semesters: Record<string, string[]>;
  error?: string;
}

export interface RequirementCategory {
  id: string;
  label: string;
  kind: "course-options" | "count-only";
  remainingCount: number;
  options?: string[];
  rule?: string;
  note?: string;
}

export interface RequirementsResponse {
  summary: {
    remainingBucketCount: number;
    totalRemainingCourseCount: number;
  };
  remaining: {
    school: RequirementCategory[];
    commonCore: RequirementCategory[];
    major: RequirementCategory[];
  };
  recommendations: Array<{
    id: string;
    label: string;
    remainingCount: number;
    options: string[];
    rule?: string;
    note?: string;
  }>;
  error?: string;
}
