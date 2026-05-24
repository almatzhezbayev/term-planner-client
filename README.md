# term-planner-client

Next.js frontend for uploading a transcript, editing the parsed result, and viewing remaining requirements.

## Run

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

## Current Flow

1. User selects a transcript PDF.
2. Frontend sends the raw file to the backend parse endpoint.
3. Parsed transcript data is rendered in an editable semester grid.
4. Parsed data is persisted in local storage so it survives reload.
5. User can request remaining requirements from the current edited transcript state.

## API Calls

### `POST http://localhost:3001/api/parse`

Called from `src/app/page.tsx`.

- Method: `POST`
- Headers:

```http
Content-Type: application/pdf
```

- Body: the selected PDF file as raw binary

Expected response:

```json
{
  "school": "science",
  "major": "math-cs",
  "admitTerm": "22-23f",
  "semesters": {
    "22-23f": ["CHEM1020", "CHEM1050", "MATH1012"]
  }
}
```

### `POST http://localhost:3001/api/requirements`

Also called from `src/app/page.tsx`.

- Method: `POST`
- Headers:

```http
Content-Type: application/json
```

- Body:

```json
{
  "school": "science",
  "major": "math-cs",
  "admitTerm": "22-23f",
  "semesters": {
    "22-23f": ["CHEM1020", "CHEM1050", "MATH1012"]
  }
}
```

This endpoint is called only when the user clicks `Show remaining courses`, so the request reflects any manual edits made in the UI after parsing.

## State Management

State is managed with Zustand in `src/stores/fileStore.ts` and persisted via `zustand/middleware/persist`.

Persisted storage key:

- `term-planner-storage`

Persisted shape:

```json
{
  "state": {
    "data": {
      "school": "science",
      "major": "math-cs",
      "admitTerm": "22-23f",
      "semesters": {
        "22-23f": ["CHEM1020", "CHEM1050", "MATH1012"]
      }
    },
    "requirements": {
      "summary": {
        "remainingBucketCount": 4,
        "totalRemainingCourseCount": 6
      },
      "remaining": {
        "school": [],
        "commonCore": [],
        "major": []
      },
      "recommendations": []
    }
  },
  "version": 0
}
```

Store fields:

- `file: File | undefined`
  - Current uploaded file object
  - Not persisted
- `data: ParsedTranscript | undefined`
  - Parsed transcript metadata and semester-course mapping
  - Persisted
- `requirements: RequirementsResponse | undefined`
  - Remaining requirement result returned by the backend
  - Persisted

Important behavior:

- `setData(...)` clears `requirements`, because remaining-course results become stale whenever transcript data changes.
- `clear()` removes both parsed transcript data and requirement results.

## Data Shapes

### `ParsedTranscript`

```ts
{
  school: string;
  major: string;
  admitTerm: string;
  semesters: Record<string, string[]>;
}
```

### `RequirementsResponse`

```ts
{
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
}
```

## UI Notes

- Semester keys are sorted with custom logic so academic years render from fall to summer.
- Empty terms between first and last detected semester are expanded in the grid.
- Course chips are editable on double click.
- Removing all text from a course chip deletes that course entry from the semester.
