'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Newspaper,
  ExternalLink,
  Globe,
  RefreshCw,
  AlertTriangle,
  Clock,
  Circle,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle,
  HelpCircle,
  XCircle,
  Search,
  Link2,
} from 'lucide-react';

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

interface TrendingPageProps {
  isFullPage?: boolean;
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
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'Verified': return 'text-green-400';
    case 'Likely Real': return 'text-emerald-400';
    case 'Partially Verified': return 'text-yellow-400';
    case 'Unverified': return 'text-orange-400';
    case 'Single Source': return 'text-red-400';
    default: return 'text-white/60';
  }
}

function statusBadgeStyle(status: string): string {
  switch (status) {
    case 'Verified': return 'bg-green-500/15 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
    case 'Likely Real': return 'bg-emerald-500/15 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.15)]';
    case 'Partially Verified': return 'bg-yellow-500/15 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.15)]';
    case 'Unverified': return 'bg-orange-500/15 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)]';
    case 'Single Source': return 'bg-red-500/15 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
    default: return 'bg-white/10 text-white/60';
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case 'Verified': return 'border-green-500/20';
    case 'Likely Real': return 'border-emerald-500/20';
    case 'Partially Verified': return 'border-yellow-500/20';
    case 'Unverified': return 'border-orange-500/20';
    case 'Single Source': return 'border-red-500/20';
    default: return 'border-white/[0.08]';
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'Verified': return <CheckCircle className="w-3 h-3 text-green-400" />;
    case 'Likely Real': return <CheckCircle className="w-3 h-3 text-emerald-400" />;
    case 'Partially Verified': return <HelpCircle className="w-3 h-3 text-yellow-400" />;
    case 'Unverified': return <AlertTriangle className="w-3 h-3 text-orange-400" />;
    case 'Single Source': return <XCircle className="w-3 h-3 text-red-400" />;
    default: return <HelpCircle className="w-3 h-3 text-white/60" />;
  }
}

export default function TrendingPage({ isFullPage = true }: TrendingPageProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [verifications, setVerifications] = useState<Map<string, VerificationResult>>(new Map());
  const [verifying, setVerifying] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const verifyArticles = useCallback(async (articleList: NewsArticle[]) => {
    if (articleList.length === 0) return;
    setVerifying(true);
    try {
      // Verify in batches of 10
      for (let i = 0; i < articleList.length; i += 10) {
        const batch = articleList.slice(i, i + 10);
        const res = await fetch('/api/news/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articles: batch.map(a => ({ title: a.title, source: a.source }))
          }),
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.results)) {
          setVerifications(prev => {
            const next = new Map(prev);
            data.results.forEach((r: VerificationResult, idx: number) => {
              const article = batch[idx];
              if (article) {
                next.set(article.title, r);
              }
            });
            return next;
          });
        }
      }
    } catch {
      // Verification failed silently, articles still show without verification
    }
    setVerifying(false);
  }, []);

  const fetchNews = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setArticles(data.data);
        setLastUpdated(new Date());
        setFailedImages(new Set());
        // Trigger verification in background
        verifyArticles(data.data);
      } else {
        setError(data?.error || 'Failed to fetch news');
      }
    } catch {
      setError('Failed to fetch news. Please check your connection.');
    }
    setLoading(false);
  }, [verifyArticles]);

  useEffect(() => {
    fetchNews();
    intervalRef.current = setInterval(() => fetchNews(false), 90000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNews]);

  const displayCount = showAll ? 20 : 10;
  const displayArticles = articles.slice(0, displayCount);

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  const toggleSources = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl px-6 py-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF2B2B] to-[#B11226] flex items-center justify-center shadow-[0_0_15px_rgba(255,43,43,0.25)]">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold font-sans tracking-tight text-[#F5F5F5]">
              Trending News
            </h2>
          </div>
          <p className="text-sm text-[#9A9AA0] font-sans mt-1 ml-11">
            Live news with real-time source cross-referencing verification
          </p>
        </div>
        <div className="flex items-center gap-4">
          {verifying && (
            <div className="flex items-center gap-1.5 text-xs text-[#FF2B2B]/70 font-sans">
              <Search className="w-3 h-3 animate-pulse" />
              <span>Verifying sources...</span>
            </div>
          )}
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-[#9A9AA0]/70 font-sans">
              <Clock className="w-3 h-3" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-full">
            <Circle className="w-2 h-2 text-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-sans font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 px-4 py-2.5 border border-white/[0.08] rounded-full bg-white/[0.03] backdrop-blur-xl flex-wrap">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-[#9A9AA0]/60" />
          <span className="text-xs text-[#9A9AA0]/60 font-sans font-medium">Source Verification:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-2.5 h-2.5 text-green-400" />
          <span className="text-[11px] text-[#9A9AA0] font-sans">Verified (5+ sources)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-[11px] text-[#9A9AA0] font-sans">Likely Real (3+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-2.5 h-2.5 text-yellow-400" />
          <span className="text-[11px] text-[#9A9AA0] font-sans">Partial (2)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-2.5 h-2.5 text-orange-400" />
          <span className="text-[11px] text-[#9A9AA0] font-sans">Unverified</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && articles.length === 0 && (
        <div className="border border-white/[0.08] rounded-2xl bg-white/[0.03] backdrop-blur-xl p-12 text-center mb-6">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 text-[#FF2B2B] animate-spin" />
          <p className="text-sm font-sans text-[#F5F5F5]/70">Fetching latest news...</p>
          <p className="text-xs font-sans text-[#9A9AA0]/50 mt-1">
            Scanning live sources and cross-referencing for verification
          </p>
        </div>
      )}

      {/* Error State */}
      {error && articles.length === 0 && (
        <div className="border border-yellow-500/20 rounded-2xl bg-yellow-500/5 backdrop-blur-xl p-8 text-center mb-6">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
          <p className="text-sm font-sans text-[#F5F5F5]/70 mb-3">{error}</p>
          <button
            onClick={() => fetchNews()}
            className="text-xs font-sans text-yellow-400 hover:text-yellow-300 underline underline-offset-4 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* News Feed */}
      <div className="space-y-3">
        {displayArticles.map((article, i) => {
          const hasImage = article.image && !failedImages.has(i);
          const verification = verifications.get(article.title);
          const isVerifying = !verification && verifying;
          const showSources = expandedSources.has(i);

          return (
            <div key={`${article.url}-${i}`} className="block group">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className={`border ${verification ? statusBorderColor(verification.verification_status) : 'border-white/[0.08]'} rounded-2xl bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_0_20px_rgba(255,43,43,0.08)] transition-all duration-300 cursor-pointer overflow-hidden`}>
                  <div className="flex">
                    {/* Image or Fallback */}
                    {hasImage ? (
                      <div className="w-36 h-32 flex-shrink-0 overflow-hidden border-r border-white/[0.08] rounded-l-2xl">
                        <img
                          src={article.image!}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={() => handleImageError(i)}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-32 flex-shrink-0 border-r border-white/[0.08] flex items-center justify-center bg-white/[0.02] rounded-l-2xl">
                        <Globe className="w-6 h-6 text-white/10" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold font-sans text-[#F5F5F5] group-hover:text-[#FF2B2B] transition-colors duration-300 line-clamp-2 mb-1.5 leading-snug">
                            {article.title}
                          </h3>
                          {article.description && (
                            <p className="text-xs text-[#9A9AA0]/60 font-sans leading-relaxed line-clamp-2 mb-2">
                              {article.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[11px] font-sans text-[#9A9AA0] bg-white/[0.06] px-2.5 py-0.5 rounded-full">
                              {article.source}
                            </span>
                            {article.publishedAt && (
                              <span className="text-[11px] text-[#9A9AA0]/50 font-sans flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {timeAgo(article.publishedAt)}
                              </span>
                            )}
                            <span className="text-[11px] text-[#9A9AA0]/40 font-sans flex items-center gap-1 ml-auto group-hover:text-[#FF2B2B]/60 transition-colors">
                              <ExternalLink className="w-2.5 h-2.5" />
                              Read
                            </span>
                          </div>
                          {/* Source Verification Badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {isVerifying ? (
                              <div className="flex items-center gap-1.5">
                                <Shield className="w-3 h-3 text-[#9A9AA0]/40" />
                                <RefreshCw className="w-2.5 h-2.5 text-[#9A9AA0]/40 animate-spin" />
                                <span className="text-[10px] font-sans text-[#9A9AA0]/40">Verifying sources...</span>
                              </div>
                            ) : verification ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Shield className="w-3 h-3 text-[#9A9AA0]/40" />
                                  <StatusIcon status={verification.verification_status} />
                                  <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full ${statusBadgeStyle(verification.verification_status)}`}>
                                    {verification.verification_status}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-mono ${statusColor(verification.verification_status)}`}>
                                  {verification.confidence_score}/100
                                </span>
                                {verification.source_count > 0 && (
                                  <button
                                    onClick={(e) => toggleSources(i, e)}
                                    className="text-[10px] text-[#9A9AA0]/60 font-sans flex items-center gap-1 hover:text-[#F5F5F5] transition-colors"
                                  >
                                    <Link2 className="w-2.5 h-2.5" />
                                    {verification.source_count} sources
                                    {showSources ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                  </button>
                                )}
                                <span className="text-[10px] text-[#9A9AA0]/40 font-sans hidden sm:inline">
                                  {verification.label}
                                </span>
                              </>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Shield className="w-3 h-3 text-[#9A9AA0]/40" />
                                <span className="text-[10px] font-sans text-[#9A9AA0]/40">Pending verification</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
              {/* Expanded corroborating sources */}
              {showSources && verification && verification.corroborating_sources.length > 0 && (
                <div className="mt-1 ml-4 mr-4 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Link2 className="w-3 h-3 text-[#9A9AA0]/60" />
                    <span className="text-[11px] font-sans font-medium text-[#9A9AA0]/80">Corroborating Sources Found:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {verification.corroborating_sources.map((source, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-white/[0.06] text-[#9A9AA0] border border-white/[0.08]"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {displayArticles.length === 0 && !loading && !error && (
          <div className="border border-white/[0.08] rounded-2xl bg-white/[0.03] backdrop-blur-xl p-12 text-center">
            <Newspaper className="w-12 h-12 mx-auto mb-4 text-white/10" />
            <p className="text-sm font-sans text-[#9A9AA0]">No news articles available</p>
            <p className="text-xs text-[#9A9AA0]/50 font-sans mt-1">
              The feed will automatically refresh
            </p>
          </div>
        )}
      </div>

      {/* Show More / Show Less */}
      {articles.length > 10 && (
        <div className="mt-5 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 text-sm font-sans text-[#9A9AA0] hover:text-[#F5F5F5] transition-all duration-300 px-5 py-2.5 border border-white/[0.08] rounded-full hover:border-white/[0.15] hover:bg-white/[0.04] hover:shadow-[0_0_15px_rgba(255,43,43,0.06)]"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Show more ({articles.length - 10} more)
              </>
            )}
          </button>
        </div>
      )}

      {/* Inline refresh indicator */}
      {loading && articles.length > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#9A9AA0]/50">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}
    </div>
  );
}
