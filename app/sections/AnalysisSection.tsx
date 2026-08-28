'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  AlertTriangle,
  Shield,
  Download,
  X,
  BarChart3,
  Loader2,
  Newspaper,
  CheckCircle,
  HelpCircle,
  XCircle,
  ExternalLink,
  Clock,
  Circle,
  RefreshCw,
  Globe,
  FileVideo,
  FileImage,
  Ban,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';



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
  title: string;
  classification: string;
  final_score: number;
  upload_count: number;
  is_rising: boolean;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
}

interface VerificationResult {
  title: string;
  corroborating_sources: string[];
  source_count: number;
  verification_status: 'Verified' | 'Likely Real' | 'Partially Verified' | 'Unverified' | 'Single Source';
  confidence_score: number;
  label: string;
}

interface AnalysisSectionProps {
  onAnalyze: (file: File) => Promise<void>;
  analysisResult: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  uploadPhase?: 'idle' | 'uploading' | 'analyzing';
  uploadProgress?: number;
  onCancelUpload?: () => void;
  trendingItems: TrendingItem[];
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ''; }
}

function SidebarVerifIcon({ status }: { status: string }) {
  switch (status) {
    case 'Verified': return <CheckCircle className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />;
    case 'Likely Real': return <CheckCircle className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />;
    case 'Partially Verified': return <HelpCircle className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" />;
    case 'Unverified': return <AlertTriangle className="w-2.5 h-2.5 text-orange-400 flex-shrink-0" />;
    case 'Single Source': return <XCircle className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />;
    default: return <HelpCircle className="w-2.5 h-2.5 text-[#9A9AA0] flex-shrink-0" />;
  }
}

function verificationGlowPill(status: string): string {
  switch (status) {
    case 'Verified': return 'bg-green-500/15 text-green-400 border border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]';
    case 'Likely Real': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    case 'Partially Verified': return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.2)]';
    case 'Unverified': return 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.2)]';
    case 'Single Source': return 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]';
    default: return 'bg-white/10 text-white/70 border border-white/20';
  }
}

function classificationGlowPill(cls: string): string {
  const c = cls?.toLowerCase() ?? '';
  if (c.includes('fake')) return 'bg-[#FF2B2B]/20 text-[#FF2B2B] border border-[#FF2B2B]/30 shadow-[0_0_12px_rgba(255,43,43,0.25)]';
  if (c.includes('suspicious')) return 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
  if (c.includes('inconclusive')) return 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
  if (c.includes('real')) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
  return 'bg-white/10 text-white/70 border border-white/20';
}

function scoreBarGradient(label: string): string {
  switch (label) {
    case 'Spatial': return 'bg-gradient-to-r from-[#FF2B2B] to-[#ff6b6b]';
    case 'Temporal': return 'bg-gradient-to-r from-blue-500 to-cyan-400';
    case 'Frequency': return 'bg-gradient-to-r from-amber-500 to-yellow-300';
    case 'Metadata': return 'bg-gradient-to-r from-white/80 to-white/50';
    case 'Source': return 'bg-gradient-to-r from-purple-400 to-fuchsia-400';
    default: return 'bg-gradient-to-r from-white/40 to-white/20';
  }
}

function scoreBarGlow(label: string): string {
  switch (label) {
    case 'Spatial': return 'shadow-[0_0_8px_rgba(255,43,43,0.4)]';
    case 'Temporal': return 'shadow-[0_0_8px_rgba(59,130,246,0.4)]';
    case 'Frequency': return 'shadow-[0_0_8px_rgba(245,158,11,0.4)]';
    case 'Metadata': return 'shadow-[0_0_8px_rgba(255,255,255,0.2)]';
    case 'Source': return 'shadow-[0_0_8px_rgba(168,85,247,0.4)]';
    default: return '';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function AnalysisSection({ onAnalyze, analysisResult, loading, error, uploadPhase = 'idle', uploadProgress = 0, onCancelUpload, trendingItems }: AnalysisSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarNews, setSidebarNews] = useState<NewsArticle[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [sidebarVerifications, setSidebarVerifications] = useState<Map<string, VerificationResult>>(new Map());
  const [sidebarVerifying, setSidebarVerifying] = useState(false);

  useEffect(() => {
    const fetchSidebarNews = async () => {
      setSidebarLoading(true);
      try {
        const res = await fetch('/api/news');
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setSidebarNews(data.data);
          // Verify articles in background
          setSidebarVerifying(true);
          try {
            const verifyRes = await fetch('/api/news/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                articles: data.data.slice(0, 8).map((a: NewsArticle) => ({ title: a.title, source: a.source }))
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData?.success && Array.isArray(verifyData.results)) {
              const newMap = new Map<string, VerificationResult>();
              verifyData.results.forEach((r: VerificationResult, idx: number) => {
                if (data.data[idx]) newMap.set(data.data[idx].title, r);
              });
              setSidebarVerifications(newMap);
            }
          } catch { /* silent */ }
          setSidebarVerifying(false);
        }
      } catch { /* silent */ }
      setSidebarLoading(false);
    };
    fetchSidebarNews();
    const interval = setInterval(fetchSidebarNews, 90000);
    return () => clearInterval(interval);
  }, []);

  const displayResult = analysisResult;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    await onAnalyze(file);
  };

  const handleDownloadReport = () => {
    if (!displayResult) return;
    const r = displayResult;
    const reasoning = Array.isArray(r.forensic_reasoning) ? r.forensic_reasoning : [];
    const report = `VERIFAI FORENSIC REPORT\n${'='.repeat(40)}\n\nClassification: ${r.classification}\nFinal Score: ${r.final_score}/100\nConfidence: ${r.confidence_level}\nMedia Type: ${r.media_type}\n\nSCORES\n------\nSpatial: ${r.spatial_score}\nTemporal: ${r.temporal_score}\nFrequency: ${r.frequency_score}\nMetadata: ${r.metadata_score}\nSource: ${r.source_score}\n\nTop Signal: ${r.top_contributing_signal}\nMetadata Flag: ${r.metadata_flag}\nOverride Applied: ${r.override_applied ? 'Yes' : 'No'}\nSource Assessment: ${r.source_assessment}\n\nFORENSIC REASONING\n------------------\n${reasoning.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verifai-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const scores = displayResult ? [
    { label: 'Spatial', value: displayResult.spatial_score },
    { label: 'Temporal', value: displayResult.temporal_score },
    { label: 'Frequency', value: displayResult.frequency_score },
    { label: 'Metadata', value: displayResult.metadata_score },
    { label: 'Source', value: displayResult.source_score },
  ] : [];

  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel - Main Analysis */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold font-sans tracking-tight text-[#F5F5F5]">Media Analysis</h2>
            <p className="text-sm text-[#9A9AA0] font-sans mt-1">Upload media for deepfake forensic analysis</p>
          </div>
        </div>

        {/* Upload Card */}
        <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl mb-6 overflow-hidden">
          <CardContent className="p-6">
            <div
              onDragOver={(e) => { if (!loading) { e.preventDefault(); setDragOver(true); } }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { if (!loading) handleDrop(e); }}
              onClick={() => { if (!loading) fileInputRef.current?.click(); }}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                loading
                  ? 'border-white/[0.06] bg-white/[0.01] cursor-not-allowed opacity-60'
                  : dragOver
                    ? 'border-[#FF2B2B] bg-[#FF2B2B]/10 shadow-[0_0_40px_rgba(255,43,43,0.15)] cursor-pointer'
                    : 'border-white/[0.12] hover:border-white/[0.25] hover:bg-white/[0.02] cursor-pointer'
              }`}
            >
              <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" disabled={loading} />
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                {file?.type.startsWith('video') ? (
                  <FileVideo className="w-7 h-7 text-[#FF2B2B]" />
                ) : file ? (
                  <FileImage className="w-7 h-7 text-[#FF2B2B]" />
                ) : (
                  <Upload className="w-7 h-7 text-[#9A9AA0]" />
                )}
              </div>
              {file ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm font-sans text-[#F5F5F5] font-medium truncate max-w-[300px]">{file.name}</span>
                    {!loading && (
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-[#9A9AA0] hover:text-[#FF2B2B] transition-colors p-1 rounded-lg hover:bg-white/[0.05]">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#9A9AA0] font-sans">
                    <span>{formatFileSize(file.size)}</span>
                    <span className="w-1 h-1 rounded-full bg-[#9A9AA0]/40" />
                    <span className="uppercase">{file.type.startsWith('video') ? 'Video' : 'Image'}</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-sans text-[#F5F5F5]/80">Drop image or video file here</p>
                  <p className="text-xs text-[#9A9AA0] mt-1.5 font-sans">Supports JPG, PNG, GIF, MP4, MOV, WEBM, AVI</p>
                </>
              )}
            </div>

            {/* Upload progress bar */}
            {loading && uploadPhase === 'uploading' && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-[#9A9AA0]">Uploading...</span>
                  <span className="text-[#F5F5F5] font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF2B2B] to-[#B11226] rounded-full shadow-[0_0_10px_rgba(255,43,43,0.4)] transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Buttons row */}
            <div className="flex gap-3 mt-5">
              <Button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="flex-1 bg-gradient-to-r from-[#FF2B2B] to-[#B11226] hover:shadow-[0_0_40px_rgba(255,43,43,0.3)] text-white font-sans font-bold rounded-xl border-0 transition-all duration-300 h-12 text-base disabled:opacity-40 disabled:shadow-none"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {uploadPhase === 'uploading' ? 'Uploading...' : 'Analyzing...'}</>
                ) : 'Analyze Media'}
              </Button>
              {loading && uploadPhase === 'uploading' && onCancelUpload && (
                <Button
                  onClick={onCancelUpload}
                  variant="outline"
                  className="h-12 px-5 border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-[#9A9AA0] hover:text-[#FF2B2B] hover:border-[#FF2B2B]/30 font-sans rounded-xl transition-all duration-300"
                >
                  <Ban className="w-4 h-4 mr-2" /> Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border border-[#FF2B2B]/30 bg-[#FF2B2B]/10 backdrop-blur-xl rounded-2xl mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FF2B2B]/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#FF2B2B]" />
              </div>
              <p className="text-sm text-red-300 font-sans">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl mb-6">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shadow-[0_0_30px_rgba(255,43,43,0.12)]">
                <Loader2 className="w-9 h-9 animate-spin text-[#FF2B2B]" />
              </div>
              {uploadPhase === 'uploading' ? (
                <>
                  <p className="text-sm font-sans text-[#F5F5F5]/80 mb-2">Uploading file... {uploadProgress}%</p>
                  <p className="text-xs text-[#9A9AA0] font-sans">Securely transferring your media to the analysis server</p>
                  <div className="mt-5">
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF2B2B] to-[#B11226] rounded-full shadow-[0_0_10px_rgba(255,43,43,0.4)] transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-sans text-[#F5F5F5]/80 mb-2">Running forensic analysis...</p>
                  <p className="text-xs text-[#9A9AA0] font-sans">5 sub-agents scanning media across spatial, temporal, frequency, metadata, and source dimensions</p>
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                      <span className="text-xs font-sans text-emerald-400">File uploaded successfully</span>
                    </div>
                    {['Spatial Analysis', 'Temporal Analysis', 'Frequency Analysis', 'Metadata Intelligence', 'Source Verification'].map((name) => (
                      <div key={name} className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                        <span className="text-xs font-sans text-[#9A9AA0]">{name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {displayResult && !loading && (
          <div className="space-y-4">
            {/* Verdict Card */}
            <Card className="border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(255,43,43,0.12)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF2B2B]/[0.03] to-transparent pointer-events-none rounded-2xl" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-[#9A9AA0] font-sans uppercase tracking-[0.2em] mb-3">Verdict</p>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-sm px-4 py-1.5 font-bold font-sans rounded-full ${classificationGlowPill(displayResult.classification)}`}>
                        {displayResult.classification}
                      </Badge>
                      {displayResult.override_applied && (
                        <Badge className="bg-[#FF2B2B]/15 text-[#FF2B2B] border border-[#FF2B2B]/25 text-xs font-sans rounded-full px-3 py-1">AI-Generated Override</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#9A9AA0] font-sans uppercase tracking-[0.2em] mb-1">Score</p>
                    <span className="text-5xl font-bold font-mono text-[#F5F5F5]">{displayResult.final_score?.toFixed?.(1) ?? '0'}</span>
                    <span className="text-sm text-[#9A9AA0] font-mono">/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <Badge className="bg-white/[0.06] text-[#9A9AA0] border border-white/[0.1] text-xs font-sans rounded-full px-3 py-1">
                    {displayResult.confidence_level} Confidence
                  </Badge>
                  <Badge className="bg-white/[0.06] text-[#9A9AA0] border border-white/[0.1] text-xs font-sans rounded-full px-3 py-1">
                    {displayResult.media_type}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Top Signal */}
            <Card className="border border-amber-500/20 bg-amber-500/[0.05] backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <p className="text-[10px] text-amber-400/80 font-sans uppercase tracking-[0.2em] mb-1.5">Top Contributing Signal</p>
                <p className="text-lg font-bold font-sans text-[#F5F5F5]">{displayResult.top_contributing_signal}</p>
              </CardContent>
            </Card>

            {/* Sub-Agent Scores */}
            <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
              <CardHeader className="pb-3 px-6 pt-5">
                <CardTitle className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#9A9AA0]">Sub-Agent Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                {scores.map((s) => (
                  <div key={s.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans text-[#F5F5F5]/80 font-medium">{s.label}</span>
                      <span className="text-xs font-mono text-[#9A9AA0]">{s.value?.toFixed?.(1) ?? '0'}</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBarGradient(s.label)} ${scoreBarGlow(s.label)} transition-all duration-700 ease-out`} style={{ width: `${Math.min(s.value ?? 0, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Forensic Reasoning */}
            <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
              <CardHeader className="pb-3 px-6 pt-5">
                <CardTitle className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#9A9AA0]">Forensic Reasoning</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <ul className="space-y-3">
                  {(Array.isArray(displayResult.forensic_reasoning) ? displayResult.forensic_reasoning : []).map((reason, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                      <span className="text-xs font-mono text-[#FF2B2B] mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg bg-[#FF2B2B]/10 flex items-center justify-center">{String(i + 1).padStart(2, '0')}</span>
                      <p className="text-sm font-sans text-[#F5F5F5]/75 leading-relaxed">{reason}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Metadata Grid */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] text-[#9A9AA0] font-sans uppercase tracking-[0.2em] mb-1.5">Metadata Flag</p>
                  <p className="text-sm font-sans text-[#F5F5F5] font-medium">{displayResult.metadata_flag?.replace(/_/g, ' ') ?? 'N/A'}</p>
                </CardContent>
              </Card>
              <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] text-[#9A9AA0] font-sans uppercase tracking-[0.2em] mb-1.5">Source</p>
                  <p className="text-sm font-sans text-[#F5F5F5] font-medium capitalize">{displayResult.source_assessment ?? 'N/A'}</p>
                </CardContent>
              </Card>
              <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] text-[#9A9AA0] font-sans uppercase tracking-[0.2em] mb-1.5">Override</p>
                  <p className="text-sm font-sans text-[#F5F5F5] font-medium">{displayResult.override_applied ? 'Applied' : 'None'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Download Button */}
            <div className="flex gap-3">
              <Button onClick={handleDownloadReport} className="bg-white/[0.06] hover:bg-white/[0.1] text-[#F5F5F5] border border-white/[0.1] hover:border-white/[0.2] font-sans rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <Download className="mr-2 w-4 h-4" /> Download Report
              </Button>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-[#9A9AA0]/60 font-sans italic leading-relaxed">Disclaimer: VerifAI provides probabilistic assessments. Results should be interpreted by qualified analysts and should not be used as sole evidence.</p>
          </div>
        )}

        {/* Empty State */}
        {!displayResult && !loading && !error && (
          <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <Shield className="w-10 h-10 text-[#9A9AA0]/30" />
              </div>
              <p className="text-sm font-sans text-[#9A9AA0] mb-2">No analysis results yet</p>
              <p className="text-xs text-[#9A9AA0]/60 font-sans">Upload an image or video to begin forensic analysis</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel - Trending News */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-6">
          <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#9A9AA0] flex items-center gap-2">
                <Newspaper className="w-3.5 h-3.5 text-[#FF2B2B]" /> Trending News
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  <span className="text-[10px] text-emerald-400/80 font-sans font-medium normal-case tracking-normal">Live</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {sidebarLoading && sidebarNews.length === 0 ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-[#FF2B2B] animate-spin" />
                  <span className="text-xs text-[#9A9AA0] font-sans">Loading news...</span>
                </div>
              ) : sidebarNews.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                  {sidebarNews.slice(0, 8).map((article, i) => {
                    const verification = sidebarVerifications.get(article.title);
                    return (
                      <a
                        key={`sidebar-${article.url}-${i}`}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300">
                          <h4 className="text-[11px] font-sans font-medium text-[#F5F5F5]/90 group-hover:text-[#FF2B2B] transition-colors line-clamp-2 leading-snug mb-2">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-sans text-[#9A9AA0] bg-white/[0.06] px-2 py-0.5 rounded-full truncate max-w-[80px]">
                              {article.source}
                            </span>
                            {article.publishedAt && (
                              <span className="text-[10px] text-[#9A9AA0]/50 font-sans flex items-center gap-0.5">
                                <Clock className="w-2 h-2" />
                                {timeAgo(article.publishedAt)}
                              </span>
                            )}
                            <span className="text-[10px] text-[#9A9AA0]/30 font-sans flex items-center gap-0.5 ml-auto group-hover:text-[#FF2B2B]/50 transition-colors">
                              <ExternalLink className="w-2 h-2" />
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {sidebarVerifying && !verification ? (
                              <>
                                <RefreshCw className="w-2.5 h-2.5 text-[#9A9AA0]/40 animate-spin flex-shrink-0" />
                                <span className="text-[9px] font-sans text-[#9A9AA0]/40">Verifying...</span>
                              </>
                            ) : verification ? (
                              <>
                                <SidebarVerifIcon status={verification.verification_status} />
                                <span className={`text-[9px] font-sans font-semibold px-2 py-0.5 rounded-full ${verificationGlowPill(verification.verification_status)}`}>
                                  {verification.verification_status}
                                </span>
                                <span className="text-[9px] font-mono text-[#9A9AA0]/50 ml-auto">{verification.source_count} sources</span>
                              </>
                            ) : (
                              <span className="text-[9px] font-sans text-[#9A9AA0]/40">Pending</span>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#9A9AA0]/50 font-sans text-center py-6">No news available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
