# Double S Studio — Client Progress Tracker

A lightweight, clean client-facing project tracker. Clients can view progress, see what's needed from them, and upload assets directly.

---

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase Firestore** (database)
- **Firebase Storage** (file uploads)
- **Vercel** (deployment)

---

## Getting Started

### 1. Clone & Install

```bash
npm install
# or
pnpm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a project
2. Add a **Web App** (no analytics needed)
3. Enable **Firestore Database** → Start in production mode
4. Enable **Storage** → Start in production mode
5. Copy your app config

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your Firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Firebase Firestore Structure

All data lives under `projects/{projectId}`.

### Top-level document: `projects/{projectId}`

```json
{
  "projectName":   "Bella Bloom Florals",
  "clientName":    "Sarah Chen",
  "progress":      65,
  "status":        "In Progress",
  "currentPhase":  "Landing Page Development",
  "currentTask":   "Responsive Design",
  "lastUpdated":   "2026-06-25T10:00:00.000Z"
}
```

**status** must be one of: `"In Progress"` · `"Completed"` · `"On Hold"` · `"Review"`

---

### Subcollection: `projects/{projectId}/roadmap`

Each document is a phase:

```json
{
  "phaseName": "Asset Collection",
  "order":     1,
  "tasks": [
    { "name": "Logo",    "completed": true  },
    { "name": "Photos",  "completed": true  },
    { "name": "Pricing", "completed": false }
  ]
}
```

Phases are sorted by the `order` field (ascending).

---

### Subcollection: `projects/{projectId}/updates`

Each document is a timeline entry:

```json
{
  "title": "Homepage layout completed",
  "date":  "2026-06-25T10:00:00.000Z"
}
```

Displayed newest first, sorted by `date` (descending).

---

### Subcollection: `projects/{projectId}/pendingItems`

Each document is an action item waiting on the client:

```json
{
  "item": "Upload product photos (high-res)"
}
```

---

### Subcollection: `projects/{projectId}/clientUploads`

Written automatically when a client uploads a file. Read-only from the admin side.

```json
{
  "fileName":   "logo-final.png",
  "fileURL":    "https://firebasestorage.googleapis.com/...",
  "uploadedAt": "2026-06-25T10:00:00.000Z"
}
```

---

### Subcollection: `projects/{projectId}/agencyFiles`

Files you share with the client (add these manually in Firestore):

```json
{
  "fileName": "Scope_of_Work.pdf",
  "fileURL":  "https://firebasestorage.googleapis.com/..."
}
```

Upload files to Firebase Storage and paste the public download URL here.

---

## Firebase Security Rules

### Firestore (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read projects (no auth)
    match /projects/{projectId}/{document=**} {
      allow read: if true;
      // Only clientUploads can be written by anyone
      allow write: if request.resource.data.keys()
        .hasAll(['fileName', 'fileURL', 'uploadedAt'])
        && resource == null;
    }
  }
}
```

### Storage (`storage.rules`)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/client-uploads/{fileName} {
      allow read, write: if true;
    }
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables
4. Deploy

---

## Adding a New Client Project

1. Open **Firestore Console**
2. Create a document at `projects/{your-project-id}`
   - The `{project-id}` is what clients will type on the homepage
   - Keep it simple: `bella-bloom`, `acme-rebrand`, etc.
3. Fill in the fields (see structure above)
4. Add subcollections: `roadmap`, `updates`, `pendingItems`, `agencyFiles`
5. Send the client their project name — that's all they need

---

## Demo Mode

Typing `demo` on the homepage loads mock data without touching Firebase. Share this with prospective clients or use it for testing.

---

## Folder Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Entry point, view routing
│   └── globals.css
├── components/
│   └── ui-custom/
│       ├── HomePage.tsx
│       ├── DashboardPage.tsx
│       ├── StatusBadge.tsx
│       ├── ProgressBar.tsx
│       ├── Section.tsx
│       ├── RoadmapSection.tsx
│       ├── UpdatesTimeline.tsx
│       ├── FileUploader.tsx
│       ├── AgencyFilesList.tsx
│       └── DashboardSkeleton.tsx
├── lib/
│   ├── firebase.ts         # All Firebase calls
│   └── mockData.ts         # Demo data
└── types/
    └── index.ts            # Shared TypeScript types
```
