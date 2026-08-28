'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProtectedRoute, useAuth } from 'lyzr-architect/client';
import { callAIAgent, uploadFiles, uploadFilesWithProgress } from '@/lib/aiAgent';
import { User, LogOut } from 'lucide-react';
import Sidebar from './sections/Sidebar';
import AnalysisSection from './sections/AnalysisSection';
import TrendingPage from './sections/TrendingPage';
import HistoryPage from './sections/HistoryPage';
import AuthScreen from './sections/AuthScreen';
import LandingPage from './sections/LandingPage';

const MANAGER_AGENT_ID = '69ec5aafab1cfba2fa6404a8';
const TRENDING_AGENT_ID = '69ec5aaff00d79a836e9f8e4';

const AGENTS = [
  { id: MANAGER_AGENT_ID, name: 'Forensic Analysis Manager', purpose: 'Coordinates 5 sub-agents for deepfake detection' },
  { id: '69ec5a87c4b36f640acfeaf6', name: 'Spatial Analysis', purpose: 'Detects spatial anomalies in media' },
  { id: '69ec5a87760c686665879a2f', name: 'Temporal Analysis', purpose: 'Analyzes temporal coherence' },
  { id: '69ec5a88760c686665879a31', name: 'Frequency Analysis', purpose: 'Spectral frequency artifact detection' },
  { id: '69ec5a88f00d79a836e9f8d6', name: 'Metadata Intelligence', purpose: 'Inspects EXIF and metadata signatures' },
  { id: '69ec5a88c4b36f640acfeaf8', name: 'Source Verification', purpose: 'Verifies media origin and provenance' },
  { id: TRENDING_AGENT_ID, name: 'Trending Investigations', purpose: 'Tracks frequently analyzed media' },
];

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#F5F5F5]">
          <div className="text-center p-8 max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_0_30px_rgba(255,43,43,0.1)]">
            <h2 className="text-xl font-semibold mb-2 font-sans">Something went wrong</h2>
            <p className="text-[#9A9AA0] mb-4 text-sm font-sans">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF2B2B] to-[#B11226] text-white text-sm font-sans rounded-xl hover:shadow-[0_0_20px_rgba(255,43,43,0.3)] transition-all duration-300"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

async function generateMediaHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateThumbnail(file: File, maxSize = 150): Promise<string> {
  return new Promise((resolve) => {
    if (file.type.startsWith('video')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.onloadeddata = () => {
        video.currentTime = 0.5;
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight, 1);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(video.src);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      video.onerror = () => resolve('');
      video.src = URL.createObjectURL(file);
    } else {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => resolve('');
      img.src = URL.createObjectURL(file);
    }
  });
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF2B2B] to-[#B11226] flex items-center justify-center text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(255,43,43,0.3)] transition-all duration-300"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[#0D0D0F]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 py-2 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06]">
            <p className="text-xs text-[#9A9AA0] font-sans truncate">{user?.email || 'User'}</p>
          </div>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.04] font-sans transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

interface AnalysisResult {
  final_score: number;
  classification: string;
  confidence_level: string;
  spatial_score: number;
  temporal_score: number;
  frequency_score: number;
  metadata_score: number;
  source_score: number;
  metadata_flag: string;
  override_applied: boolean;
  source_assessment: string;
  top_contributing_signal: string;
  forensic_reasoning: string[];
  media_type: string;
}

interface TrendingItem {
  _id?: string;
  rank?: number;
  title: string;
  classification: string;
  final_score: number;
  upload_count: number;
  is_rising: boolean;
  snippet?: string;
}

interface AnalysisRecord {
  _id?: string;
  filename: string;
  media_type: string;
  classification: string;
  final_score: number;
  confidence_level: string;
  spatial_score: number;
  temporal_score: number;
  frequency_score: number;
  metadata_score: number;
  source_score: number;
  metadata_flag: string;
  override_applied: boolean;
  source_assessment: string;
  top_contributing_signal: string;
  forensic_reasoning: string;
  media_preview?: string;
  createdAt?: string;
}

function AppContent() {
  const [activePage, setActivePage] = useState('analysis');
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'analyzing'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);

  const [historyRecords, setHistoryRecords] = useState<AnalysisRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch('/api/trending');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setTrendingItems(data.data);
      }
    } catch { /* silent */ }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/analyses');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setHistoryRecords(data.data);
      }
    } catch { /* silent */ }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    fetchTrending();
    fetchHistory();
  }, [fetchTrending, fetchHistory]);

  // Auto-refresh history every 15 seconds when on history page
  useEffect(() => {
    if (activePage !== 'history') return;
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, [activePage, fetchHistory]);

  // Also refresh history when navigating to it
  useEffect(() => {
    if (activePage === 'history') {
      fetchHistory();
    }
  }, [activePage, fetchHistory]);

  const handleDeleteAnalysis = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/analyses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setHistoryRecords((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  }, []);

  const handleCancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setAnalysisLoading(false);
    setUploadPhase('idle');
    setUploadProgress(0);
    setActiveAgentId(null);
    setAnalysisError(null);
  }, []);

  const handleAnalyze = async (file: File) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setActiveAgentId(MANAGER_AGENT_ID);
    setUploadPhase('uploading');
    setUploadProgress(0);

    try {
      const uploadResult = await uploadFilesWithProgress(
        file,
        (percent) => setUploadProgress(percent),
        xhrRef
      );
      xhrRef.current = null;

      if (!uploadResult.success || !Array.isArray(uploadResult.asset_ids) || uploadResult.asset_ids.length === 0) {
        if (uploadResult.error === 'Upload was cancelled by user') {
          return;
        }
        const serverMessage = uploadResult.message || uploadResult.error || '';
        const errorMsg = serverMessage && serverMessage !== 'Upload failed'
          ? serverMessage
          : 'Failed to upload file. Please check your connection and try again.';
        setAnalysisError(errorMsg);
        setAnalysisLoading(false);
        setUploadPhase('idle');
        setUploadProgress(0);
        setActiveAgentId(null);
        return;
      }

      setUploadPhase('analyzing');

      const mediaType = file.type.startsWith('video') ? 'video' : 'image';
      const message = `Analyze this ${mediaType} file named "${file.name}" for deepfake detection. Perform full forensic analysis across all five dimensions.`;

      const result = await callAIAgent(message, MANAGER_AGENT_ID, { assets: uploadResult.asset_ids });

      if (result?.success) {
        const data = result?.response?.result ?? result?.response ?? {};
        const parsed: AnalysisResult = {
          final_score: data?.final_score ?? 0,
          classification: data?.classification ?? 'Inconclusive',
          confidence_level: data?.confidence_level ?? 'Low',
          spatial_score: data?.spatial_score ?? 0,
          temporal_score: data?.temporal_score ?? 0,
          frequency_score: data?.frequency_score ?? 0,
          metadata_score: data?.metadata_score ?? 0,
          source_score: data?.source_score ?? 0,
          metadata_flag: data?.metadata_flag ?? 'missing',
          override_applied: data?.override_applied ?? false,
          source_assessment: data?.source_assessment ?? 'unknown',
          top_contributing_signal: data?.top_contributing_signal ?? 'Unknown',
          forensic_reasoning: Array.isArray(data?.forensic_reasoning) ? data.forensic_reasoning : [],
          media_type: data?.media_type ?? mediaType,
        };
        setAnalysisResult(parsed);

        const mediaHash = await generateMediaHash(file);
        const reasoning = Array.isArray(parsed.forensic_reasoning) ? parsed.forensic_reasoning.join(' ') : '';

        // Generate compressed thumbnail for history
        let mediaPreviewUrl = '';
        try {
          mediaPreviewUrl = await generateThumbnail(file, 200);
        } catch { /* silent */ }

        try {
          const savePayload = {
            user_id: 'current',
            media_hash: mediaHash,
            media_type: parsed.media_type,
            filename: file.name,
            final_score: parsed.final_score,
            classification: parsed.classification,
            spatial_score: parsed.spatial_score,
            temporal_score: parsed.temporal_score,
            frequency_score: parsed.frequency_score,
            metadata_score: parsed.metadata_score,
            source_score: parsed.source_score,
            metadata_flag: parsed.metadata_flag,
            override_applied: parsed.override_applied,
            source_assessment: parsed.source_assessment,
            top_contributing_signal: parsed.top_contributing_signal,
            forensic_reasoning: reasoning,
            confidence_level: parsed.confidence_level,
            media_preview: mediaPreviewUrl || undefined,
          };
          const saveRes = await fetch('/api/analyses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(savePayload),
          });
          const saveData = await saveRes.json().catch(() => ({}));
          if (!saveRes.ok) {
            console.error('Failed to save analysis:', saveData);
          }
        } catch (saveErr) {
          console.error('Error saving analysis to history:', saveErr);
        }

        try {
          await fetchTrending();
        } catch { /* silent */ }

        await fetchHistory();
      } else {
        setAnalysisError(result?.error ?? 'Analysis failed. Please try again.');
      }
    } catch (err: any) {
      setAnalysisError(err?.message ?? 'An unexpected error occurred.');
    }

    setAnalysisLoading(false);
    setUploadPhase('idle');
    setUploadProgress(0);
    setActiveAgentId(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex">
      <Sidebar activePage={activePage} onNavigate={setActivePage} agents={AGENTS} activeAgentId={activeAgentId} />
      <main className="ml-64 flex-1 p-6 min-h-screen">
        <div className="flex items-center justify-end mb-4">
          <ProfileMenu />
        </div>
        {activePage === 'analysis' && (
          <AnalysisSection
            onAnalyze={handleAnalyze}
            analysisResult={analysisResult}
            loading={analysisLoading}
            error={analysisError}
            uploadPhase={uploadPhase}
            uploadProgress={uploadProgress}
            onCancelUpload={handleCancelUpload}
            trendingItems={trendingItems}
          />
        )}
        {activePage === 'trending' && (
          <TrendingPage isFullPage={true} />
        )}
        {activePage === 'history' && (
          <HistoryPage
            records={historyRecords}
            loading={historyLoading}
            onRefresh={fetchHistory}
            onDelete={handleDeleteAnalysis}
          />
        )}
      </main>
    </div>
  );
}

function UnauthenticatedView() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (showAuth) {
    return <AuthScreen initialMode={authMode} onBackToLanding={() => setShowAuth(false)} />;
  }

  return (
    <LandingPage
      onNavigateToAuth={(mode) => {
        setAuthMode(mode);
        setShowAuth(true);
      }}
    />
  );
}

export default function Page() {
  return (
    <ErrorBoundary>
      <ProtectedRoute unauthenticatedFallback={<UnauthenticatedView />}>
        <AppContent />
      </ProtectedRoute>
    </ErrorBoundary>
  );
}
