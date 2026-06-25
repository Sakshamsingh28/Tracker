'use client';

import { useState, useEffect } from 'react';
import { 
  Lock, Plus, Trash2, Save, ArrowLeft, Loader2, FileText, CheckSquare, 
  Clock, Check, PlusCircle, AlertCircle, Download, Link as LinkIcon 
} from 'lucide-react';
import { 
  fetchAllProjects, saveProject, fetchRoadmap, saveRoadmapPhase, 
  deleteRoadmapPhase, fetchUpdates, addUpdate, deleteUpdate, 
  fetchPendingItems, addPendingItem, deletePendingItem, 
  fetchAgencyFiles, addAgencyFile, uploadAgencyFile, deleteAgencyFile, fetchClientUploads
} from '@/lib/firebase';
import type { 
  Project, RoadmapPhase, Update, PendingItem, ClientUpload, AgencyFile, Task 
} from '@/types';
import StatusBadge from '@/components/ui-custom/StatusBadge';
import AgencyFileUploader from '@/components/ui-custom/AgencyFileUploader';

export default function AdminPage() {
  // Auth state
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Projects state
  const [projects, setProjects] = useState<(Project & { id: string })[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Active Project Data
  const [projectForm, setProjectForm] = useState<Project | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [agencyFiles, setAgencyFiles] = useState<AgencyFile[]>([]);
  const [clientUploads, setClientUploads] = useState<ClientUpload[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<'details' | 'roadmap' | 'updates' | 'actions' | 'files'>('details');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectId, setNewProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectError, setNewProjectError] = useState('');

  // Add Item States
  const [newUpdateText, setNewUpdateText] = useState('');
  const [newPendingText, setNewPendingText] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');

  // Save feedbacks
  const [saveSuccess, setSaveSuccess] = useState(false);

  const correctPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || 'admin123';

  // Load all projects on auth success
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  // Load active project data on selection
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
    } else {
      setProjectForm(null);
      setRoadmap([]);
      setUpdates([]);
      setPendingItems([]);
      setAgencyFiles([]);
      setClientUploads([]);
    }
  }, [selectedProjectId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === correctPasscode) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect passcode. Please try again.');
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await fetchAllProjects();
      setProjects(allProjects);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async (projectId: string) => {
    setLoading(true);
    try {
      const match = projects.find(p => p.id === projectId);
      if (match) {
        setProjectForm({ ...match });
      }
      
      const [rMap, upds, pnd, agencyF, clientU] = await Promise.all([
        fetchRoadmap(projectId),
        fetchUpdates(projectId),
        fetchPendingItems(projectId),
        fetchAgencyFiles(projectId),
        fetchClientUploads(projectId).catch(() => [] as ClientUpload[])
      ]);

      setRoadmap(rMap);
      setUpdates(upds);
      setPendingItems(pnd);
      setAgencyFiles(agencyF);
      setClientUploads(clientU);
    } catch (err) {
      console.error('Failed to load project details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewProjectError('');
    const cleanId = newProjectId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    
    if (!cleanId) {
      setNewProjectError('Please enter a valid project ID.');
      return;
    }
    if (projects.some(p => p.id === cleanId)) {
      setNewProjectError('Project ID already exists.');
      return;
    }

    const defaultProject: Project = {
      projectName: newProjectName.trim() || 'New Project',
      clientName: newProjectClient.trim() || 'New Client',
      progress: 0,
      status: 'In Progress',
      currentPhase: 'Discovery',
      currentTask: 'Initial Kickoff',
      lastUpdated: new Date().toISOString()
    };

    try {
      setSaveLoading(true);
      await saveProject(cleanId, defaultProject);
      await loadProjects();
      setSelectedProjectId(cleanId);
      setIsCreatingProject(false);
      setNewProjectId('');
      setNewProjectName('');
      setNewProjectClient('');
    } catch (err) {
      console.error(err);
      setNewProjectError('Failed to create project in Firestore.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedProjectId || !projectForm) return;
    setSaveLoading(true);
    try {
      const updatedProject = {
        ...projectForm,
        lastUpdated: new Date().toISOString()
      };
      await saveProject(selectedProjectId, updatedProject);
      setProjectForm(updatedProject);
      
      // Update projects list
      setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...updatedProject, id: selectedProjectId } : p));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save project details.');
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Roadmap Actions ---
  const handleAddPhase = () => {
    const nextOrder = roadmap.length > 0 ? Math.max(...roadmap.map(r => r.order)) + 1 : 1;
    const newPhase: RoadmapPhase = {
      id: `phase_${Date.now()}`,
      phaseName: 'New Phase',
      order: nextOrder,
      tasks: []
    };
    setRoadmap([...roadmap, newPhase]);
  };

  const handleUpdatePhaseName = (phaseId: string, name: string) => {
    setRoadmap(prev => prev.map(p => p.id === phaseId ? { ...p, phaseName: name } : p));
  };

  const handleUpdatePhaseOrder = (phaseId: string, orderVal: number) => {
    setRoadmap(prev => prev.map(p => p.id === phaseId ? { ...p, order: orderVal } : p));
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!selectedProjectId) return;
    if (!confirm('Are you sure you want to delete this phase?')) return;
    
    // If it has a real id (saved to firestore), delete it there
    if (!phaseId.startsWith('phase_')) {
      try {
        await deleteRoadmapPhase(selectedProjectId, phaseId);
      } catch (err) {
        console.error(err);
      }
    }
    setRoadmap(prev => prev.filter(p => p.id !== phaseId));
  };

  const handleAddTask = (phaseId: string) => {
    setRoadmap(prev => prev.map(p => {
      if (p.id === phaseId) {
        return {
          ...p,
          tasks: [...p.tasks, { name: 'New Task', completed: false }]
        };
      }
      return p;
    }));
  };

  const handleUpdateTaskName = (phaseId: string, taskIndex: number, newName: string) => {
    setRoadmap(prev => prev.map(p => {
      if (p.id === phaseId) {
        const nextTasks = [...p.tasks];
        nextTasks[taskIndex] = { ...nextTasks[taskIndex], name: newName };
        return { ...p, tasks: nextTasks };
      }
      return p;
    }));
  };

  const handleToggleTaskCompleted = (phaseId: string, taskIndex: number) => {
    setRoadmap(prev => prev.map(p => {
      if (p.id === phaseId) {
        const nextTasks = [...p.tasks];
        nextTasks[taskIndex] = { ...nextTasks[taskIndex], completed: !nextTasks[taskIndex].completed };
        return { ...p, tasks: nextTasks };
      }
      return p;
    }));
  };

  const handleDeleteTask = (phaseId: string, taskIndex: number) => {
    setRoadmap(prev => prev.map(p => {
      if (p.id === phaseId) {
        const nextTasks = p.tasks.filter((_, idx) => idx !== taskIndex);
        return { ...p, tasks: nextTasks };
      }
      return p;
    }));
  };

  const handleSaveRoadmap = async () => {
    if (!selectedProjectId) return;
    setSaveLoading(true);
    try {
      // Save all active phases
      const savePromises = roadmap.map(phase => {
        // Clean phase ID if it was a temp client ID
        const finalPhase = { ...phase };
        return saveRoadmapPhase(selectedProjectId, finalPhase);
      });
      await Promise.all(savePromises);
      
      // Reload values
      const refreshed = await fetchRoadmap(selectedProjectId);
      setRoadmap(refreshed);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save roadmap.');
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Updates Actions ---
  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newUpdateText.trim()) return;
    try {
      const added = await addUpdate(selectedProjectId, newUpdateText.trim());
      setUpdates([added, ...updates]);
      setNewUpdateText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!selectedProjectId) return;
    if (!confirm('Delete this timeline update?')) return;
    try {
      await deleteUpdate(selectedProjectId, updateId);
      setUpdates(prev => prev.filter(u => u.id !== updateId));
    } catch (err) {
      console.error(err);
    }
  };

  // --- Client Actions Actions ---
  const handleAddPendingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newPendingText.trim()) return;
    try {
      const added = await addPendingItem(selectedProjectId, newPendingText.trim());
      setPendingItems([...pendingItems, added]);
      setNewPendingText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePendingItem = async (itemId: string) => {
    if (!selectedProjectId) return;
    if (!confirm('Delete this action item?')) return;
    try {
      await deletePendingItem(selectedProjectId, itemId);
      setPendingItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  // --- Files Actions ---
  const handleAddAgencyFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newFileName.trim() || !newFileUrl.trim()) return;
    try {
      const added = await addAgencyFile(selectedProjectId, newFileName.trim(), newFileUrl.trim());
      setAgencyFiles([...agencyFiles, added]);
      setNewFileName('');
      setNewFileUrl('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAgencyFile = async (fileId: string) => {
    if (!selectedProjectId) return;
    if (!confirm('Delete this file link?')) return;
    try {
      await deleteAgencyFile(selectedProjectId, fileId);
      setAgencyFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error(err);
    }
  };

  // --- Login Render ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100/50 to-zinc-50 flex flex-col items-center justify-center px-4">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-900 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-900 inline-block" />
          </div>
          <span className="text-sm font-semibold tracking-[0.2em] text-gray-900 uppercase">
            Double S Studio
          </span>
        </div>

        <div className="w-full max-w-md border border-white/60 bg-white/70 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] p-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gray-100 rounded-full text-gray-700">
              <Lock size={24} />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">
            Admin Portal Access
          </h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            Enter the passcode configured in your environment keys to proceed.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin passcode…"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200/60 bg-white/40 backdrop-blur-sm text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-transparent transition-all"
              autoFocus
            />
            {authError && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                <AlertCircle size={12} />
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all"
            >
              Authenticate Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100/50 to-zinc-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-gray-200/50 shadow-[0_2px_15px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-900 inline-block" />
                <span className="w-2 h-2 rounded-full bg-gray-900 inline-block" />
              </div>
              <span className="text-xs font-semibold tracking-[0.18em] text-gray-900 uppercase">
                Double S Studio
              </span>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-900 text-white">
              ADMIN CONTROL
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="/" 
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={13} />
              Back to Client site
            </a>
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="text-xs text-red-600 font-medium hover:underline bg-transparent border-0 cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar: Projects List */}
        <aside className="w-full md:w-80 shrink-0">
          <div className="border border-white/60 bg-white/70 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] p-4 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Projects</h2>
              <button
                onClick={() => setIsCreatingProject(!isCreatingProject)}
                className="p-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center justify-center"
                title="Create New Project"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {loading && projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-xs">Loading database…</span>
                </div>
              ) : projects.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">No projects found. Create one!</p>
              ) : (
                projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setIsCreatingProject(false);
                    }}
                    className={`w-full text-left px-3 py-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      selectedProjectId === p.id 
                        ? 'border-gray-900 bg-gray-50/80 shadow-sm' 
                        : 'border-transparent hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{p.projectName}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>ID: <code className="bg-gray-100 px-1 rounded font-mono">{p.id}</code></span>
                      <span>{p.progress}% done</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Right Pane: Project Form / Creation Form */}
        <main className="flex-1 min-w-0">
          
          {/* Create Project Panel */}
          {isCreatingProject ? (
            <div className="border border-white/60 bg-white/70 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] p-6 max-w-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Create a New Client Project</h2>
              <p className="text-xs text-gray-400 mb-6">This registers a document in Firestore. Clients login using the Unique ID.</p>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Unique Project ID (Letters, numbers, dashes only)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. acme-rebrand, flower-shop"
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Website redesign"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Client Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={newProjectClient}
                    onChange={(e) => setNewProjectClient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                {newProjectError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle size={12} />
                    {newProjectError}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5"
                  >
                    {saveLoading ? <Loader2 className="animate-spin" size={14} /> : null}
                    Create Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProject(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : selectedProjectId && projectForm ? (
            
            /* Main Project Editor */
            <div className="border border-white/60 bg-white/70 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] p-6 flex flex-col">
              
              {/* Active Project Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
                    <span>Client ID: <code className="bg-gray-100 px-1 rounded font-mono font-semibold text-gray-700">{selectedProjectId}</code></span>
                    <span>•</span>
                    <span>Client: {projectForm.clientName}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                    {projectForm.projectName}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      <Check size={12} />
                      Changes Saved!
                    </span>
                  )}
                  {saveLoading && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Loader2 className="animate-spin" size={12} />
                      Saving…
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 mb-6 overflow-x-auto gap-4 scrollbar-none">
                {[
                  { id: 'details', label: 'Details', icon: FileText },
                  { id: 'roadmap', label: 'Roadmap', icon: CheckSquare },
                  { id: 'updates', label: 'Timeline & Files', icon: Clock },
                  { id: 'actions', label: 'Client Requests', icon: PlusCircle }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                      activeTab === tab.id 
                        ? 'border-gray-900 text-gray-900 font-bold' 
                        : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Loader overlay */}
              {loading && (
                <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-sm">Fetching Firestore collections…</span>
                </div>
              )}

              {/* Tab Panes */}
              {!loading && (
                <div className="space-y-6">
                  
                  {/* DETAILS TAB */}
                  {activeTab === 'details' && (
                    <div className="space-y-5 max-w-xl">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project Name</label>
                          <input
                            type="text"
                            value={projectForm.projectName}
                            onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Client Name</label>
                          <input
                            type="text"
                            value={projectForm.clientName}
                            onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                          <select
                            value={projectForm.status}
                            onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          >
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Review">Review</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Progress ({projectForm.progress}%)
                          </label>
                          <div className="flex items-center gap-2 py-1.5">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={projectForm.progress}
                              onChange={(e) => setProjectForm({ ...projectForm, progress: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Current Phase</label>
                          <input
                            type="text"
                            value={projectForm.currentPhase}
                            onChange={(e) => setProjectForm({ ...projectForm, currentPhase: e.target.value })}
                            placeholder="e.g. Design Development"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Current Task</label>
                          <input
                            type="text"
                            value={projectForm.currentTask}
                            onChange={(e) => setProjectForm({ ...projectForm, currentTask: e.target.value })}
                            placeholder="e.g. Responsive Mockups"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={handleSaveDetails}
                          disabled={saveLoading}
                          className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5"
                        >
                          <Save size={14} />
                          Save Project Details
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ROADMAP TAB */}
                  {activeTab === 'roadmap' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Roadmap Phases</h3>
                          <p className="text-xs text-gray-400">Sort order determines placement in client dashboard.</p>
                        </div>
                        <button
                          onClick={handleAddPhase}
                          className="px-3 py-1.5 border border-gray-200 text-xs font-semibold hover:bg-gray-50 rounded-lg flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Add Phase
                        </button>
                      </div>

                      <div className="space-y-4">
                        {roadmap.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
                            No phases added yet. Click "Add Phase" above.
                          </p>
                        ) : (
                          // Sort roadmap copy by order ascending
                          [...roadmap].sort((a, b) => a.order - b.order).map((phase) => (
                            <div key={phase.id} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                              <div className="flex items-center gap-3 justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={phase.phaseName}
                                    onChange={(e) => handleUpdatePhaseName(phase.id, e.target.value)}
                                    placeholder="Phase Name (e.g. Asset Collection)"
                                    className="px-2.5 py-1.5 text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg flex-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                                  />
                                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Order:</span>
                                    <input
                                      type="number"
                                      value={phase.order}
                                      onChange={(e) => handleUpdatePhaseOrder(phase.id, parseInt(e.target.value) || 0)}
                                      className="w-10 text-xs font-bold text-gray-700 bg-transparent border-0 focus:outline-none p-0 text-center"
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeletePhase(phase.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                  title="Delete Phase"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {/* Task List in Phase */}
                              <div className="pl-4 border-l-2 border-gray-200/60 space-y-2">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between mb-1">
                                  <span>Tasks</span>
                                  <button
                                    onClick={() => handleAddTask(phase.id)}
                                    className="text-gray-500 hover:text-gray-900 flex items-center gap-0.5 lowercase font-semibold"
                                  >
                                    <Plus size={10} />
                                    add task
                                  </button>
                                </div>

                                {phase.tasks.map((task, taskIdx) => (
                                  <div key={taskIdx} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={task.completed}
                                      onChange={() => handleToggleTaskCompleted(phase.id, taskIdx)}
                                      className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900 accent-gray-900 cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      value={task.name}
                                      onChange={(e) => handleUpdateTaskName(phase.id, taskIdx, e.target.value)}
                                      className="px-2 py-1 text-xs text-gray-800 border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:bg-white bg-transparent flex-1 focus:outline-none"
                                    />
                                    <button
                                      onClick={() => handleDeleteTask(phase.id, taskIdx)}
                                      className="p-1 text-gray-300 hover:text-red-500 rounded"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}

                                {phase.tasks.length === 0 && (
                                  <p className="text-[11px] text-gray-400 italic">No tasks in this phase.</p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleSaveRoadmap}
                          disabled={saveLoading}
                          className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5"
                        >
                          <Save size={14} />
                          Save Roadmap Phases
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TIMELINE & FILES TAB */}
                  {activeTab === 'updates' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Timeline Updates */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Timeline Updates</h3>
                          <p className="text-xs text-gray-400">Add timeline event messages visible to the client.</p>
                        </div>

                        <form onSubmit={handleAddUpdate} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Final mockups uploaded for review"
                            value={newUpdateText}
                            onChange={(e) => setNewUpdateText(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
                          >
                            Add
                          </button>
                        </form>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {updates.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-4 text-center">No updates logged.</p>
                          ) : (
                            updates.map(upd => (
                              <div key={upd.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white text-xs">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-gray-900">{upd.title}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(upd.date).toLocaleDateString()}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteUpdate(upd.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right: Agency Files */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Shared Files</h3>
                          <p className="text-xs text-gray-400">Provide file downloads (URLs) for client files.</p>
                        </div>

                        <AgencyFileUploader
                          onUpload={async (file, onProgress) => {
                            if (!selectedProjectId) throw new Error('No project selected');
                            const added = await uploadAgencyFile(selectedProjectId, file, onProgress);
                            setAgencyFiles(prev => [...prev, added]);
                            return added;
                          }}
                          onUploadLink={async (fileName, fileURL) => {
                            if (!selectedProjectId) throw new Error('No project selected');
                            const added = await addAgencyFile(selectedProjectId, fileName, fileURL);
                            setAgencyFiles(prev => [...prev, added]);
                            return added;
                          }}
                        />

                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Uploaded by Agency</h4>
                          {agencyFiles.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2">No files shared yet.</p>
                          ) : (
                            agencyFiles.map(file => {
                              const isData = file.fileURL && file.fileURL.startsWith('data:');
                              return (
                                <div key={file.id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-xl bg-white text-xs">
                                  <span className="font-medium text-gray-700 flex items-center gap-1.5 truncate">
                                    <FileText size={12} className="text-gray-400 shrink-0" />
                                    {file.fileName}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {isData ? (
                                      <a 
                                        href={file.fileURL} 
                                        download={file.fileName}
                                        className="p-1 text-gray-400 hover:text-gray-800"
                                        title="Download File"
                                      >
                                        <Download size={12} />
                                      </a>
                                    ) : (
                                      <a 
                                        href={file.fileURL} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="p-1 text-gray-400 hover:text-gray-800"
                                        title="Open Link"
                                      >
                                        <LinkIcon size={12} />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => handleDeleteAgencyFile(file.id)}
                                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}

                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100">Uploaded by Client</h4>
                          {clientUploads.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2">Client has not uploaded any assets yet.</p>
                          ) : (
                            clientUploads.map(upload => {
                              const isData = upload.fileURL && upload.fileURL.startsWith('data:');
                              return (
                                <div key={upload.id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-xl bg-white text-xs">
                                  <div className="space-y-0.5 truncate">
                                    <p className="font-semibold text-gray-700 truncate">{upload.fileName}</p>
                                    <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                                      <span>Uploaded: {new Date(upload.uploadedAt).toLocaleDateString()}</span>
                                      <span>•</span>
                                      <span className="font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">{upload.category || 'Other'}</span>
                                    </div>
                                  </div>
                                  {isData ? (
                                    <a 
                                      href={upload.fileURL} 
                                      download={upload.fileName}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-[10px] hover:bg-gray-200 whitespace-nowrap"
                                    >
                                      Download
                                    </a>
                                  ) : (
                                    <a 
                                      href={upload.fileURL} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="px-2 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-[10px] hover:bg-gray-200 whitespace-nowrap"
                                    >
                                      Open Link
                                    </a>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CLIENT REQUESTS TAB */}
                  {activeTab === 'actions' && (
                    <div className="space-y-4 max-w-xl">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Waiting for Client Action</h3>
                        <p className="text-xs text-gray-400">These will appear as checklist instructions in client's "Waiting For You" box.</p>
                      </div>

                      <form onSubmit={handleAddPendingItem} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Provide high-res brand logos and hex codes"
                          value={newPendingText}
                          onChange={(e) => setNewPendingText(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
                        >
                          Add Request
                        </button>
                      </form>

                      <div className="space-y-2">
                        {pendingItems.length === 0 ? (
                          <p className="text-xs text-gray-400 italic py-4 text-center">No action requests pending.</p>
                        ) : (
                          pendingItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white text-xs">
                              <span className="font-medium text-gray-800">{item.item}</span>
                              <button
                                onClick={() => handleDeletePendingItem(item.id)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            /* Selected state placeholder */
            <div className="h-[600px] border border-dashed border-gray-250/80 bg-white/30 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-3">
              <FolderOpen size={36} className="text-gray-300" />
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">No Project Selected</h3>
                <p className="text-xs text-gray-400">Select an existing project from the sidebar, or click "+" to add a new one.</p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// Dummy interface mappings to prevent typescript errors
const FolderOpen = ({ size, className }: { size: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
  </svg>
);
