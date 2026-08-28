'use client';

import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, RefreshCw, Check, X, Image, Video, Eye, XCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AnalysisRecord {
  _id?: string;
  filename: string;
  media_type: string;
  classification: string;
  final_score: number;
  confidence_level: string;
  spatial_score: number | null;
  temporal_score: number | null;
  frequency_score: number | null;
  metadata_score: number | null;
  source_score: number | null;
  metadata_flag: string;
  override_applied: boolean;
  source_assessment: string;
  top_contributing_signal: string;
  forensic_reasoning: string;
  models_used?: string[];
  models_skipped?: string[];
  media_preview?: string;
  createdAt?: string;
}

interface HistoryPageProps {
  records: AnalysisRecord[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

function classificationBadgeStyle(cls: string): string {
  const c = cls?.toLowerCase() ?? '';
  if (c.includes('fake')) return 'bg-red-500/15 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
  if (c.includes('suspicious')) return 'bg-yellow-500/15 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
  if (c.includes('inconclusive')) return 'bg-yellow-600/15 text-yellow-500 shadow-[0_0_10px_rgba(202,138,4,0.15)]';
  if (c.includes('real')) return 'bg-green-500/15 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
  return 'bg-white/10 text-white/60';
}

function scoreColor(val: number): string {
  if (val <= 25) return 'from-green-500 to-green-400';
  if (val <= 50) return 'from-yellow-500 to-yellow-400';
  if (val <= 75) return 'from-orange-500 to-orange-400';
  return 'from-red-500 to-red-400';
}

function scoreGlow(val: number): string {
  if (val <= 25) return 'shadow-[0_0_6px_rgba(34,197,94,0.3)]';
  if (val <= 50) return 'shadow-[0_0_6px_rgba(234,179,8,0.3)]';
  if (val <= 75) return 'shadow-[0_0_6px_rgba(249,115,22,0.3)]';
  return 'shadow-[0_0_6px_rgba(239,68,68,0.3)]';
}

function scoreTextColor(val: number): string {
  if (val <= 25) return 'text-green-400';
  if (val <= 50) return 'text-yellow-400';
  if (val <= 75) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBadgeStyle(val: number): string {
  if (val > 75) return 'bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.25)]';
  if (val > 50) return 'bg-orange-500/20 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.25)]';
  if (val > 25) return 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.25)]';
  return 'bg-green-500/20 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.25)]';
}

export default function HistoryPage({ records, loading, onRefresh, onDelete }: HistoryPageProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mediaModal, setMediaModal] = useState<{ url: string; type: string; filename: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const displayRecords = Array.isArray(records) ? records : [];

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div>
      {/* Media Preview Modal */}
      {mediaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8" onClick={() => setMediaModal(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMediaModal(null)}
              className="absolute -top-12 right-0 text-[#9A9AA0] hover:text-[#F5F5F5] flex items-center gap-2 text-sm font-sans transition-colors"
            >
              <XCircle className="w-5 h-5" /> Close
            </button>
            <div className="border border-white/[0.08] bg-[#0D0D0F] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,43,43,0.1)]">
              {mediaModal.type === 'video' ? (
                <video
                  src={mediaModal.url}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh] object-contain"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <img
                  src={mediaModal.url}
                  alt={mediaModal.filename}
                  className="w-full max-h-[80vh] object-contain"
                />
              )}
            </div>
            <p className="text-xs text-[#9A9AA0] font-sans mt-3 text-center">{mediaModal.filename}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-[#F5F5F5]">Analysis History</h2>
          <p className="text-sm text-[#9A9AA0] font-sans mt-1">Your private forensic analysis results</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={onRefresh}
            disabled={loading}
            className="bg-white/[0.05] hover:bg-white/[0.08] text-[#F5F5F5] border border-white/[0.08] font-sans rounded-xl hover:border-white/[0.15] hover:shadow-[0_0_15px_rgba(255,43,43,0.06)] transition-all duration-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && (
        <div className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl mb-6">
          <div className="p-8 text-center">
            <div className="w-8 h-8 mx-auto mb-3 border-2 border-t-[#FF2B2B] border-r-[#FF2B2B] border-b-transparent border-l-transparent rounded-full animate-spin" />
            <p className="text-sm font-sans text-[#9A9AA0]">Loading your history...</p>
          </div>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-180px)]">
        {displayRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayRecords.map((rec) => {
              const id = rec._id ?? rec.filename;
              const isExpanded = expandedId === id;
              const scoreEntries = [
                { label: 'Spatial', value: rec.spatial_score },
                { label: 'Temporal', value: rec.temporal_score },
                { label: 'Frequency', value: rec.frequency_score },
                { label: 'Metadata', value: rec.metadata_score },
                { label: 'Source', value: rec.source_score },
              ];
              const modelsUsed = Array.isArray(rec.models_used) ? rec.models_used : [];
              const modelsSkipped = Array.isArray(rec.models_skipped) ? rec.models_skipped : [];

              return (
                <Card key={id} className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/[0.12] hover:shadow-[0_0_25px_rgba(255,43,43,0.06)] transition-all duration-300 overflow-hidden rounded-2xl">
                  <CardContent className="p-0">
                    {/* Media Preview Area */}
                    <div
                      className="h-40 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-center relative cursor-pointer group rounded-t-2xl overflow-hidden"
                      onClick={() => {
                        if (rec.media_preview) {
                          setMediaModal({ url: rec.media_preview, type: rec.media_type, filename: rec.filename });
                        }
                      }}
                    >
                      {rec.media_preview ? (
                        <>
                          {rec.media_type === 'video' ? (
                            <video src={rec.media_preview} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={rec.media_preview} alt={rec.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-white/15">
                          {rec.media_type === 'video' ? (
                            <Video className="w-10 h-10" />
                          ) : (
                            <Image className="w-10 h-10" />
                          )}
                          <span className="text-xs font-sans">No preview available</span>
                        </div>
                      )}
                      {/* Score badge overlay */}
                      <div className="absolute top-3 right-3">
                        <div className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full ${scoreBadgeStyle(rec.final_score)}`}>
                          {rec.final_score?.toFixed?.(1) ?? '0'}/100
                        </div>
                      </div>
                      {/* Media type badge */}
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-mono text-[#F5F5F5]/80 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider">{rec.media_type}</span>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-2">
                          <h3 className="text-sm font-bold font-sans text-[#F5F5F5] truncate">{rec.filename}</h3>
                          <p className="text-xs text-[#9A9AA0]/60 font-sans mt-0.5">{formatDate(rec.createdAt)}</p>
                        </div>
                        <Badge className={`text-[10px] px-2.5 py-0.5 font-sans flex-shrink-0 rounded-full border-0 ${classificationBadgeStyle(rec.classification)}`}>
                          {rec.classification}
                        </Badge>
                      </div>

                      <p className="text-xs text-[#9A9AA0] font-sans mb-3">
                        Top signal: <span className="text-[#FF2B2B] font-medium">{rec.top_contributing_signal}</span>
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : id)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-[#9A9AA0] hover:text-[#F5F5F5] transition-all duration-300 border border-white/[0.08] hover:border-white/[0.15] rounded-xl hover:bg-white/[0.04] font-sans"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                        {confirmDeleteId === id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(id)}
                              disabled={deletingId === id}
                              className="px-3 py-2 text-xs font-sans bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 disabled:opacity-50"
                            >
                              {deletingId === id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-2 text-xs font-sans text-[#9A9AA0] hover:text-[#F5F5F5] border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all duration-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(id)}
                            className="px-3 py-2 text-xs text-red-400/50 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/20 rounded-xl transition-all duration-300"
                            title="Delete analysis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          {/* Score Breakdown */}
                          <div>
                            <p className="text-xs text-[#9A9AA0]/60 font-sans uppercase tracking-widest mb-2">Score Breakdown</p>
                            <div className="space-y-2.5">
                              {scoreEntries.map((s) => (
                                <div key={s.label} className="flex items-center gap-2">
                                  <span className="text-xs font-sans text-[#9A9AA0] w-20 flex-shrink-0">{s.label}</span>
                                  {s.value === null || s.value === undefined ? (
                                    <span className="text-xs font-mono text-[#9A9AA0]/40">N/A</span>
                                  ) : (
                                    <>
                                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r ${scoreColor(s.value)} rounded-full ${scoreGlow(s.value)}`} style={{ width: `${Math.min(s.value, 100)}%` }} />
                                      </div>
                                      <span className={`text-xs font-mono w-10 text-right ${scoreTextColor(s.value)}`}>{s.value.toFixed(1)}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.05]">
                              <p className="text-[10px] text-[#9A9AA0]/60 font-sans uppercase tracking-wider">Confidence</p>
                              <p className="text-sm font-sans text-[#F5F5F5] mt-0.5">{rec.confidence_level}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.05]">
                              <p className="text-[10px] text-[#9A9AA0]/60 font-sans uppercase tracking-wider">Source</p>
                              <p className="text-sm font-sans text-[#F5F5F5] capitalize mt-0.5">{rec.source_assessment ?? 'N/A'}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.05]">
                              <p className="text-[10px] text-[#9A9AA0]/60 font-sans uppercase tracking-wider">Metadata Flag</p>
                              <p className="text-sm font-sans text-[#F5F5F5] mt-0.5">{rec.metadata_flag?.replace(/_/g, ' ') ?? 'N/A'}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.05]">
                              <p className="text-[10px] text-[#9A9AA0]/60 font-sans uppercase tracking-wider">Override</p>
                              <p className="text-sm font-sans text-[#F5F5F5] mt-0.5">{rec.override_applied ? 'Yes' : 'No'}</p>
                            </div>
                          </div>

                          {/* Reasoning */}
                          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
                            <p className="text-[10px] text-[#9A9AA0]/60 font-sans uppercase tracking-widest mb-1.5">Forensic Reasoning</p>
                            <p className="text-xs font-sans text-[#9A9AA0] leading-relaxed">{rec.forensic_reasoning}</p>
                          </div>

                          {/* Models */}
                          {(modelsUsed.length > 0 || modelsSkipped.length > 0) && (
                            <div className="pt-3 border-t border-white/[0.06]">
                              {modelsUsed.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-[10px] text-[#9A9AA0]/60 font-sans uppercase tracking-wider mb-1.5">Models Used</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {modelsUsed.map((m, mi) => (
                                      <span key={mi} className="inline-flex items-center gap-1 text-xs font-sans text-green-400 bg-green-400/10 px-2.5 py-0.5 rounded-full">
                                        <Check className="w-3 h-3" /> {m}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {modelsSkipped.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-[#9A9AA0]/60 font-sans uppercase tracking-wider mb-1.5">Models Skipped</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {modelsSkipped.map((m, mi) => (
                                      <span key={mi} className="inline-flex items-center gap-1 text-xs font-sans text-[#9A9AA0]/50 bg-white/[0.04] px-2.5 py-0.5 rounded-full">
                                        <X className="w-3 h-3" /> {m}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                <Clock className="w-10 h-10 text-white/10" />
              </div>
              <p className="text-lg font-sans text-[#9A9AA0] mb-1">No analysis history yet</p>
              <p className="text-sm text-[#9A9AA0]/50 font-sans">Upload and analyze media to see your results here</p>
            </div>
          )
        )}
      </ScrollArea>
    </div>
  );
}
