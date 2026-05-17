"use client";

import { KeyboardEvent, useState } from "react";
import { useTxStore } from "@/stores/fileStore";
import { ParsedTranscript } from "@/lib/types";

type TermPart = "f" | "w" | "s" | "sm";

const TERM_ORDER: TermPart[] = ["f", "w", "s", "sm"];

interface ParsedTermKey {
  startYear: number;
  term: TermPart;
}

const TERM_LABELS: Record<TermPart, string> = {
  f: "Fall",
  w: "Winter",
  s: "Spring",
  sm: "Summer",
};

function parseTermKey(termKey: string): ParsedTermKey | null {
  const match = termKey.match(/^(\d{2})-(\d{2})(f|w|s|sm)$/);
  if (!match) return null;

  return {
    startYear: Number(match[1]),
    term: match[3] as TermPart,
  };
}

function compareTermKeys(a: string, b: string) {
  const parsedA = parseTermKey(a);
  const parsedB = parseTermKey(b);

  if (!parsedA || !parsedB) return a.localeCompare(b);

  if (parsedA.startYear !== parsedB.startYear) {
    return parsedA.startYear - parsedB.startYear;
  }

  return TERM_ORDER.indexOf(parsedA.term) - TERM_ORDER.indexOf(parsedB.term);
}

function buildTermKey(startYear: number, term: TermPart) {
  const nextYear = (startYear + 1) % 100;
  return `${String(startYear).padStart(2, "0")}-${String(nextYear).padStart(
    2,
    "0",
  )}${term}`;
}

function getExpandedSemesterKeys(data: ParsedTranscript) {
  const existingKeys = Object.keys(data.semesters).filter(
    (key) => parseTermKey(key) !== null,
  );
  const anchorKeys = [...existingKeys, data.admitTerm].filter(
    (key, index, array) =>
      array.indexOf(key) === index && parseTermKey(key) !== null,
  );

  if (anchorKeys.length === 0) return Object.keys(data.semesters).sort();

  const sortedKeys = [...anchorKeys].sort(compareTermKeys);
  const first = parseTermKey(sortedKeys[0]);
  const last = parseTermKey(sortedKeys[sortedKeys.length - 1]);

  if (!first || !last) return sortedKeys;

  const keys: string[] = [];

  for (let year = first.startYear; year <= last.startYear; year += 1) {
    for (const term of TERM_ORDER) {
      const termKey = buildTermKey(year, term);
      if (compareTermKeys(termKey, sortedKeys[0]) < 0) continue;
      if (compareTermKeys(termKey, sortedKeys[sortedKeys.length - 1]) > 0)
        continue;
      keys.push(termKey);
    }
  }

  return keys;
}

function formatSemesterTitle(termKey: string) {
  const parsed = parseTermKey(termKey);
  if (!parsed) return termKey;

  return `${TERM_LABELS[parsed.term]} ${termKey.slice(0, 5)}`;
}

function formatAcademicYear(startYear: number) {
  const endYear = (startYear + 1) % 100;
  return `${String(startYear).padStart(2, "0")}-${String(endYear).padStart(2, "0")}`;
}

function getSemesterRows(data: ParsedTranscript) {
  const semesterKeys = getExpandedSemesterKeys(data);
  const rows = new Map<number, Record<TermPart, string>>();

  for (const semesterKey of semesterKeys) {
    const parsed = parseTermKey(semesterKey);
    if (!parsed) continue;

    const existingRow = rows.get(parsed.startYear) ?? {
      f: buildTermKey(parsed.startYear, "f"),
      w: buildTermKey(parsed.startYear, "w"),
      s: buildTermKey(parsed.startYear, "s"),
      sm: buildTermKey(parsed.startYear, "sm"),
    };

    existingRow[parsed.term] = semesterKey;
    rows.set(parsed.startYear, existingRow);
  }

  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([startYear, semesters]) => ({ startYear, semesters }));
}

interface CourseChipProps {
  course: string;
  onSave: (value: string) => void;
}

function CourseChip({ course, onSave }: CourseChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(course);

  const commit = () => {
    const nextValue = draft.trim();
    onSave(nextValue);
    setDraft(nextValue);
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }

    if (event.key === "Escape") {
      setDraft(course);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-slate-500"
      />
    );
  }

  return (
    <button
      type="button"
      onDoubleClick={() => {
        setDraft(course);
        setIsEditing(true);
      }}
      className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-left font-mono text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
      title="Double click to edit"
    >
      {course || "New course"}
    </button>
  );
}

export default function Home() {
  const { file, setFile, data, setData, clear } = useTxStore();

  const processFile = (file: File | undefined) => {
    if (file == undefined) alert("Please upload a file");
    else if (file.type === "application/pdf") {
      setFile(file);
      return;
    }
  };

  const handleParseTranscript = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: file,
      });

      const data: ParsedTranscript = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setData(data);
    } catch (error) {
      alert(error);
    }
  };

  const handleClear = () => {
    useTxStore.persist.clearStorage();
    clear();
  };

  const updateField = (
    field: "school" | "major" | "admitTerm",
    value: string,
  ) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  const updateSemesterCourse = (
    semesterKey: string,
    courseIndex: number,
    value: string,
  ) => {
    if (!data) return;

    const existingCourses = data.semesters[semesterKey] ?? [];
    const nextCourses = existingCourses.filter(() => true);

    if (value) nextCourses[courseIndex] = value;
    else nextCourses.splice(courseIndex, 1);

    setData({
      ...data,
      semesters: {
        ...data.semesters,
        [semesterKey]: nextCourses,
      },
    });
  };

  const addSemesterCourse = (semesterKey: string) => {
    if (!data) return;

    const existingCourses = data.semesters[semesterKey] ?? [];

    setData({
      ...data,
      semesters: {
        ...data.semesters,
        [semesterKey]: [...existingCourses, ""],
      },
    });
  };

  const semesterRows = data ? getSemesterRows(data) : [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-4xl font-semibold tracking-tight">term planner</p>
          <p className="mt-2 text-base text-slate-600">
            Upload your transcript PDF, parse it, then edit the result directly
            in the grid.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              onChange={(e) => processFile(e.target.files?.[0])}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2"
            />
            <button
              onClick={handleParseTranscript}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
            >
              Parse transcript
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>

        {data && (
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-lg font-semibold">Transcript details</p>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-600">
                    School
                  </span>
                  <input
                    value={data.school}
                    onChange={(e) => updateField("school", e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-600">
                    Major
                  </span>
                  <input
                    value={data.major}
                    onChange={(e) => updateField("major", e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-600">
                    Admission term
                  </span>
                  <input
                    value={data.admitTerm}
                    onChange={(e) => updateField("admitTerm", e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Semesters</p>
                  <p className="text-sm text-slate-600">
                    Each row is one academic year, ordered from fall to summer.
                    Double click a course chip to edit it.
                  </p>
                </div>
              </div>

              <div className="mt-4 hidden grid-cols-4 gap-4 text-sm font-medium text-slate-500 lg:grid">
                {TERM_ORDER.map((term) => (
                  <div key={term} className="px-1">
                    {TERM_LABELS[term]}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-6">
                {semesterRows.map((row) => (
                  <div key={row.startYear} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Academic year {formatAcademicYear(row.startYear)}
                      </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-4">
                      {TERM_ORDER.map((term) => {
                        const semesterKey = row.semesters[term];
                        const courses = data.semesters[semesterKey] ?? [];

                        return (
                          <div
                            key={semesterKey}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {formatSemesterTitle(semesterKey)}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {semesterKey}
                                </p>
                              </div>
                            </div>

                            <div className="flex min-h-36 flex-col gap-2">
                              {courses.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-400">
                                  No courses yet
                                </div>
                              )}

                              {courses.map((course, courseIndex) => (
                                <CourseChip
                                  key={`${semesterKey}-${courseIndex}`}
                                  course={course}
                                  onSave={(value) =>
                                    updateSemesterCourse(
                                      semesterKey,
                                      courseIndex,
                                      value,
                                    )
                                  }
                                />
                              ))}

                              <button
                                type="button"
                                onClick={() => addSemesterCourse(semesterKey)}
                                className="mt-auto rounded-full border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-400 hover:text-slate-800"
                              >
                                Add course
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
