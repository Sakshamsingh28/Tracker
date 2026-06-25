import type {
  Project, RoadmapPhase, Update, PendingItem, ClientUpload, AgencyFile,
} from '@/types';

export const DEMO_PROJECT_ID = 'demo';

export const mockProject: Project = {
  projectName: 'Bella Bloom Florals',
  clientName: 'Sarah Chen',
  progress: 65,
  status: 'In Progress',
  currentPhase: 'Landing Page Development',
  currentTask: 'Responsive Design',
  lastUpdated: new Date().toISOString(),
};

export const mockRoadmap: RoadmapPhase[] = [
  {
    id: '1',
    phaseName: 'Asset Collection',
    order: 1,
    tasks: [
      { name: 'Logo',            completed: true  },
      { name: 'Photos',          completed: true  },
      { name: 'Pricing',         completed: true  },
      { name: 'Contact Details', completed: true  },
      { name: 'Domain',          completed: true  },
    ],
  },
  {
    id: '2',
    phaseName: 'Landing Page Development',
    order: 2,
    tasks: [
      { name: 'Wireframe',        completed: true  },
      { name: 'UI Design',        completed: true  },
      { name: 'Mobile Optim.',    completed: false },
      { name: 'Contact Form',     completed: false },
    ],
  },
  {
    id: '3',
    phaseName: 'Review & Launch',
    order: 3,
    tasks: [
      { name: 'Client Review',   completed: false },
      { name: 'Revisions',       completed: false },
      { name: 'DNS Setup',       completed: false },
      { name: 'Go Live',         completed: false },
    ],
  },
];

export const mockUpdates: Update[] = [
  { id: '1', title: 'Homepage layout completed',      date: new Date().toISOString() },
  { id: '2', title: 'Contact form integrated',        date: new Date(Date.now() - 86_400_000).toISOString() },
  { id: '3', title: 'Wireframe approved by client',   date: new Date(Date.now() - 172_800_000).toISOString() },
  { id: '4', title: 'Initial design brief completed', date: new Date(Date.now() - 432_000_000).toISOString() },
];

export const mockPendingItems: PendingItem[] = [
  { id: '1', item: 'Upload product photos (high-res)' },
  { id: '2', item: 'Share Instagram account access'   },
  { id: '3', item: 'Confirm final colour preferences' },
];

export const mockClientUploads: ClientUpload[] = [];

export const mockAgencyFiles: AgencyFile[] = [
  { id: '1', fileName: 'Scope_of_Work.pdf',         fileURL: '#' },
  { id: '2', fileName: 'Invoice_001.pdf',            fileURL: '#' },
  { id: '3', fileName: 'LandingPage_Preview.jpg',   fileURL: '#' },
];
