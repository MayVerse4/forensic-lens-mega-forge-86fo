'use client';

import React, { useState, useCallback } from 'react';
import { FileText, AlertTriangle, Shield, Download, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TextAnalysisResult {
  text_score: number | null;
  text_classification: string;
  confidence_level: string;
  detected_patterns: string[];
  factual_issues: string[];
  reasoning: string;
}

interface TextAnalysisSectionProps {
  onAnalyze: (text: string) => Promise<void>;
  analysisResult: TextAnalysisResult | null;
  loading: boolean;
  error: string | null;
  showSample: boolean;
  onToggleSample: (val: boolean) => void;
}

const SAMPLE_RESULT: TextAnalysisResult = {
  text_score: 78,
  text_classification: 'likely_ai_generated',
  confidence_level: 'high',
  detected_patterns: [
    'Unnaturally consistent sentence length',
    'Overuse of transition phrases',
    'Generic hedging language',
    'Lack of personal voice',
  ],
  factual_issues: [
    'Claim about 95% accuracy rate lacks citation',
    'Referenced study could not be verified',
  ],
  reasoning:
    'Score of 78 due to strong AI generation patterns including uniform paragraph structure, excessive transition word usage, and complete absence of personal voice or domain-specific terminology.',
};

function classificationGlowPill(cls: string): string {
  const c = cls?.toLowerCase() ?? '';
  if (c.includes('authentic')) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
  if (c.includes('ai_generated') || c.includes('ai generated')) return 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_12px_rgba(255,43,43,0.25)]';
  if (c.includes('misinformation')) return 'bg-red-600/20 text-red-400 border border-red-600/30 shadow-[0_0_12px_rgba(255,43,43,0.25)]';
  if (c.includes('suspicious')) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.2)]';
  if (c.includes('inconclusive')) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.2)]';
  return 'bg-white/10 text-white/70 border border-white/20';
}

function classificationLabel(cls: string): string {
  return (cls ?? 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-white/40';
  if (score >= 70) return 'text-red-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-green-400';
}

export default function TextAnalysisSection({
  onAnalyze,
  analysisResult,
  loading,
  error,
  showSample,
  onToggleSample,
}: TextAnalysisSectionProps) {
  const [text, setText] = useState('');

  const displayResult = showSample ? SAMPLE_RESULT : analysisResult;

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    await onAnalyze(text.trim());
  };

  const handleDownloadReport = () => {
    if (!displayResult) return;
    const r = displayResult;
    const patterns = Array.isArray(r.detected_patterns) ? r.detected_patterns : [];
    const issues = Array.isArray(r.factual_issues) ? r.factual_issues : [];
    const report = `VERIFAI TEXT ANALYSIS REPORT\n${'='.repeat(40)}\n\nClassification: ${classificationLabel(r.text_classification)}\nScore: ${r.text_score ?? 'N/A'}/100\nConfidence: ${r.confidence_level}\n\nDETECTED PATTERNS\n-----------------\n${patterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nFACTUAL ISSUES\n--------------\n${issues.length > 0 ? issues.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'None detected'}\n\nREASONING\n---------\n${r.reasoning}\n`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verifai-text-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">Text Analysis</h2>
          <p className="text-sm text-[#9A9AA0] mt-1">
            Analyze text for AI-generation patterns, misinformation, and authenticity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="sample-toggle-text" className="text-xs text-[#9A9AA0]">
            Sample Data
          </Label>
          <Switch id="sample-toggle-text" checked={showSample} onCheckedChange={onToggleSample} />
        </div>
      </div>

      <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl mb-6">
        <CardContent className="p-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the text you want to analyze for authenticity, AI generation patterns, or misinformation..."
            className="w-full h-48 bg-white/[0.03] border border-white/[0.08] text-[#F5F5F5] text-sm p-4 rounded-xl resize-none focus:outline-none focus:border-[#FF2B2B]/40 focus:shadow-[0_0_20px_rgba(255,43,43,0.1)] placeholder:text-white/25 transition-all duration-300"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[#9A9AA0]">
              {text.length} characters / ~{Math.ceil(text.split(/\s+/).filter(Boolean).length)} words
            </span>
            {text.length > 0 && (
              <button onClick={() => setText('')} className="text-xs text-[#9A9AA0] hover:text-white flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={!text.trim() || loading}
            className="w-full mt-4 h-12 bg-gradient-to-r from-[#FF2B2B] to-[#B11226] hover:shadow-[0_0_40px_rgba(255,43,43,0.3)] text-white font-semibold rounded-xl border-0 transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing text...
              </>
            ) : (
              <>
                <FileText className="mr-2 w-4 h-4" /> Analyze Text
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border border-red-500/30 bg-red-500/10 backdrop-blur-xl rounded-2xl mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl mb-6">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF2B2B]" />
            </div>
            <p className="text-sm text-[#F5F5F5]/80 mb-2">Analyzing text content...</p>
            <p className="text-xs text-[#9A9AA0]">
              Scanning for AI-generation patterns, factual consistency, and authenticity signals
            </p>
          </CardContent>
        </Card>
      )}

      {displayResult && !loading && (
        <div className="space-y-4">
          <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(255,43,43,0.08)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#9A9AA0] uppercase tracking-[0.2em] mb-3">Verdict</p>
                  <Badge
                    className={`text-sm px-4 py-1.5 font-semibold rounded-full ${classificationGlowPill(displayResult.text_classification)}`}
                  >
                    {classificationLabel(displayResult.text_classification)}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9A9AA0] uppercase tracking-[0.2em] mb-1">Score</p>
                  <span className={`text-4xl font-bold font-mono ${scoreColor(displayResult.text_score)}`}>
                    {displayResult.text_score ?? '--'}
                  </span>
                  <span className="text-sm text-[#9A9AA0] font-mono">/100</span>
                </div>
              </div>
              <div className="mt-4">
                <Badge
                  className="bg-white/[0.06] text-[#9A9AA0] border border-white/[0.08] text-xs rounded-full px-3 py-1"
                >
                  {displayResult.confidence_level} Confidence
                </Badge>
              </div>
            </CardContent>
          </Card>

          {Array.isArray(displayResult.detected_patterns) && displayResult.detected_patterns.length > 0 && (
            <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-[#9A9AA0] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FF2B2B]" /> Detected Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {displayResult.detected_patterns.map((pattern, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3 bg-red-500/[0.04] border border-red-500/10 rounded-xl">
                      <span className="text-xs font-mono text-[#FF2B2B] mt-0.5 flex-shrink-0 bg-red-500/10 w-6 h-6 rounded-lg flex items-center justify-center">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="text-sm text-[#F5F5F5]/80">{pattern}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {Array.isArray(displayResult.factual_issues) && displayResult.factual_issues.length > 0 && (
            <Card className="border border-yellow-500/20 bg-yellow-500/[0.04] backdrop-blur-xl rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-yellow-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Factual Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {displayResult.factual_issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3 bg-yellow-500/[0.04] border border-yellow-500/10 rounded-xl">
                      <span className="text-xs font-mono text-yellow-500 mt-0.5 flex-shrink-0 bg-yellow-500/10 w-6 h-6 rounded-lg flex items-center justify-center">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="text-sm text-[#F5F5F5]/80">{issue}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-[0.2em] text-[#9A9AA0]">Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#F5F5F5]/80 leading-relaxed">{displayResult.reasoning}</p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={handleDownloadReport}
              className="bg-white/[0.06] hover:bg-white/[0.1] text-[#F5F5F5] border border-white/[0.08] rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300"
            >
              <Download className="mr-2 w-4 h-4" /> Download Report
            </Button>
          </div>

          <p className="text-xs text-[#9A9AA0]/60 italic">
            Disclaimer: VerifAI provides probabilistic assessments. Text analysis results should be interpreted by qualified analysts.
          </p>
        </div>
      )}

      {!displayResult && !loading && !error && (
        <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <FileText className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-sm text-[#9A9AA0] mb-2">No text analysis results yet</p>
            <p className="text-xs text-[#9A9AA0]/60">
              Paste text content above to analyze for AI generation, misinformation, and authenticity
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
