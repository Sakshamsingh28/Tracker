import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import type {
  Project, RoadmapPhase, Update, PendingItem, ClientUpload, AgencyFile,
} from '@/types';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initializing on hot-reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// ─── Project ──────────────────────────────────────────────────────────────
export async function fetchProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, 'projects', projectId));
  return snap.exists() ? (snap.data() as Project) : null;
}

// ─── Roadmap ──────────────────────────────────────────────────────────────
export async function fetchRoadmap(projectId: string): Promise<RoadmapPhase[]> {
  const q = query(collection(db, 'projects', projectId, 'roadmap'), orderBy('order'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoadmapPhase));
}

// ─── Updates ──────────────────────────────────────────────────────────────
export async function fetchUpdates(projectId: string): Promise<Update[]> {
  const q = query(collection(db, 'projects', projectId, 'updates'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Update));
}

// ─── Pending Items ────────────────────────────────────────────────────────
export async function fetchPendingItems(projectId: string): Promise<PendingItem[]> {
  const snap = await getDocs(collection(db, 'projects', projectId, 'pendingItems'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PendingItem));
}

// ─── Client Uploads ───────────────────────────────────────────────────────
export async function fetchClientUploads(projectId: string): Promise<ClientUpload[]> {
  const q = query(
    collection(db, 'projects', projectId, 'clientUploads'),
    orderBy('uploadedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientUpload));
}

export async function uploadClientFile(
  projectId: string,
  file: File,
  category: string,
  onProgress: (pct: number) => void,
): Promise<ClientUpload> {
  const fileRef = ref(storage, `projects/${projectId}/client-uploads/client_${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(pct));
      },
      (err) => {
        reject(err);
      },
      async () => {
        try {
          const fileURL = await getDownloadURL(uploadTask.snapshot.ref);
          const uploadedAt = new Date().toISOString();
          const ref2 = await addDoc(
            collection(db, 'projects', projectId, 'clientUploads'),
            { fileName: file.name, fileURL, uploadedAt, category },
          );
          resolve({ id: ref2.id, fileName: file.name, fileURL, uploadedAt, category });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export async function addClientUploadLink(
  projectId: string,
  fileName: string,
  fileURL: string,
  category: string,
): Promise<ClientUpload> {
  const uploadedAt = new Date().toISOString();
  const ref2 = await addDoc(
    collection(db, 'projects', projectId, 'clientUploads'),
    { fileName, fileURL, uploadedAt, category },
  );
  return { id: ref2.id, fileName, fileURL, uploadedAt, category };
}

// ─── Agency Files ─────────────────────────────────────────────────────────
export async function fetchAgencyFiles(projectId: string): Promise<AgencyFile[]> {
  const snap = await getDocs(collection(db, 'projects', projectId, 'agencyFiles'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AgencyFile));
}

// ─── Admin Dashboard Actions ──────────────────────────────────────────────

export async function fetchAllProjects(): Promise<(Project & { id: string })[]> {
  const snap = await getDocs(collection(db, 'projects'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project & { id: string }));
}

export async function saveProject(projectId: string, project: Project): Promise<void> {
  await setDoc(doc(db, 'projects', projectId), project);
}

export async function saveRoadmapPhase(projectId: string, phase: Omit<RoadmapPhase, 'id'> & { id?: string }): Promise<string> {
  const phaseId = phase.id || doc(collection(db, 'projects', projectId, 'roadmap')).id;
  const { id, ...data } = phase;
  await setDoc(doc(db, 'projects', projectId, 'roadmap', phaseId), data);
  return phaseId;
}

export async function deleteRoadmapPhase(projectId: string, phaseId: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId, 'roadmap', phaseId));
}

export async function addUpdate(projectId: string, title: string): Promise<Update> {
  const date = new Date().toISOString();
  const ref2 = await addDoc(collection(db, 'projects', projectId, 'updates'), {
    title,
    date,
  });
  return { id: ref2.id, title, date };
}

export async function deleteUpdate(projectId: string, updateId: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId, 'updates', updateId));
}

export async function addPendingItem(projectId: string, item: string): Promise<PendingItem> {
  const ref2 = await addDoc(collection(db, 'projects', projectId, 'pendingItems'), {
    item,
  });
  return { id: ref2.id, item };
}

export async function deletePendingItem(projectId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId, 'pendingItems', itemId));
}

export async function addAgencyFile(projectId: string, fileName: string, fileURL: string): Promise<AgencyFile> {
  const ref2 = await addDoc(collection(db, 'projects', projectId, 'agencyFiles'), {
    fileName,
    fileURL,
  });
  return { id: ref2.id, fileName, fileURL };
}

export async function uploadAgencyFile(
  projectId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<AgencyFile> {
  const fileRef = ref(storage, `projects/${projectId}/client-uploads/agency_${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(pct));
      },
      (err) => {
        reject(err);
      },
      async () => {
        try {
          const fileURL = await getDownloadURL(uploadTask.snapshot.ref);
          const ref2 = await addDoc(
            collection(db, 'projects', projectId, 'agencyFiles'),
            { fileName: file.name, fileURL },
          );
          resolve({ id: ref2.id, fileName: file.name, fileURL });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export async function deleteAgencyFile(projectId: string, fileId: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId, 'agencyFiles', fileId));
}

