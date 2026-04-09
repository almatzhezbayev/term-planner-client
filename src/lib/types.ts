export interface ParsedTranscript {
  school: string;
  major: string;
  admitTerm: string;
  semesters: Record<string, string[]>;
  error?: string;
}
