import { NextRequest, NextResponse } from 'next/server';

interface VerificationResult {
  title: string;
  corroborating_sources: string[];
  source_count: number;
  verification_status: 'Verified' | 'Likely Real' | 'Partially Verified' | 'Unverified' | 'Single Source';
  confidence_score: number;
  label: string;
}

// In-memory cache to avoid re-verifying same headlines (TTL: 10 min)
const verificationCache = new Map<string, { result: VerificationResult; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function cleanCache() {
  const now = Date.now();
  for (const [key, val] of verificationCache.entries()) {
    if (now - val.timestamp > CACHE_TTL) {
      verificationCache.delete(key);
    }
  }
}

// Extract key terms from a headline for searching
function extractSearchTerms(title: string): string {
  // Remove common filler words, keep the substantive keywords
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'with', 'by', 'from', 'as', 'it', 'its', 'this', 'that', 'has', 'have', 'had', 'be', 'been', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'do', 'does', 'did', 'not', 'no', 'so', 'if', 'than', 'too', 'very', 'just', 'about', 'up', 'out', 'new', 'says', 'said', 'after', 'over', 'into', 'also', 'how', 'what', 'when', 'where', 'who', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such']);

  const words = title
    .replace(/[^\w\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Take up to 6 most important words (longer words first as they tend to be more specific)
  return words
    .sort((a, b) => b.length - a.length)
    .slice(0, 6)
    .join(' ');
}

// Search DuckDuckGo for corroborating sources
async function searchForCorroboration(title: string): Promise<{ sources: string[]; domains: string[] }> {
  const searchTerms = extractSearchTerms(title);
  if (!searchTerms) return { sources: [], domains: [] };

  try {
    const encodedQuery = encodeURIComponent(searchTerms);
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return { sources: [], domains: [] };
    const html = await res.text();

    // Extract result URLs and titles
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    const sources: string[] = [];
    const domains = new Set<string>();
    let match;

    while ((match = resultRegex.exec(html)) !== null && sources.length < 15) {
      const rawUrl = match[1] || '';
      const resultTitle = (match[2] || '').replace(/<[^>]*>/g, '').trim();

      let url = rawUrl;
      const uddgMatch = rawUrl.match(/uddg=([^&]*)/);
      if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);

      try {
        const hostname = new URL(url).hostname.replace('www.', '');
        // Skip search engines, social media aggregators
        const skipDomains = ['duckduckgo.com', 'google.com', 'bing.com', 'yahoo.com', 'facebook.com', 'twitter.com', 'x.com', 'reddit.com', 'youtube.com', 'tiktok.com', 'instagram.com'];
        if (!skipDomains.some(d => hostname.includes(d)) && !domains.has(hostname)) {
          domains.add(hostname);
          sources.push(hostname);
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return { sources, domains: Array.from(domains) };
  } catch {
    return { sources: [], domains: [] };
  }
}

// Known major trusted news outlets
const TRUSTED_OUTLETS = new Set([
  'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'nytimes.com',
  'washingtonpost.com', 'theguardian.com', 'npr.org', 'pbs.org',
  'aljazeera.com', 'france24.com', 'dw.com', 'abc.net.au',
  'cnn.com', 'nbcnews.com', 'cbsnews.com', 'abcnews.go.com',
  'foxnews.com', 'usatoday.com', 'wsj.com', 'ft.com',
  'bloomberg.com', 'cnbc.com', 'politico.com', 'thehill.com',
  'axios.com', 'time.com', 'newsweek.com', 'forbes.com',
  'economist.com', 'nature.com', 'sciencemag.org', 'independent.co.uk',
  'telegraph.co.uk', 'latimes.com', 'chicagotribune.com',
  'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com',
  'sky.com', 'skynews.com.au', 'cbc.ca', 'globalnews.ca',
  'hindustantimes.com', 'ndtv.com', 'timesofindia.indiatimes.com',
]);

function computeVerification(
  originalSource: string,
  corroboratingSources: string[],
): VerificationResult & { corroborating_sources: string[] } {
  // Count how many trusted outlets are among the corroborating sources
  const trustedCount = corroboratingSources.filter(s =>
    TRUSTED_OUTLETS.has(s) || Array.from(TRUSTED_OUTLETS).some(t => s.includes(t.split('.')[0]))
  ).length;

  const totalSources = corroboratingSources.length;
  const isOriginalTrusted = TRUSTED_OUTLETS.has(originalSource.replace('www.', '')) ||
    Array.from(TRUSTED_OUTLETS).some(t => originalSource.includes(t.split('.')[0]));

  let verification_status: VerificationResult['verification_status'];
  let confidence_score: number;
  let label: string;

  if (totalSources >= 5 && trustedCount >= 2) {
    verification_status = 'Verified';
    confidence_score = Math.min(95, 70 + totalSources * 2 + trustedCount * 5);
    label = `Corroborated by ${totalSources} sources including ${trustedCount} trusted outlets`;
  } else if (totalSources >= 3 || (totalSources >= 2 && trustedCount >= 1)) {
    verification_status = 'Likely Real';
    confidence_score = Math.min(85, 55 + totalSources * 5 + trustedCount * 8);
    label = `Found in ${totalSources} sources${trustedCount > 0 ? `, ${trustedCount} trusted` : ''}`;
  } else if (totalSources >= 2) {
    verification_status = 'Partially Verified';
    confidence_score = Math.min(65, 40 + totalSources * 8);
    label = `Found in ${totalSources} sources, needs more corroboration`;
  } else if (totalSources === 1 || isOriginalTrusted) {
    verification_status = 'Unverified';
    confidence_score = isOriginalTrusted ? 50 : 30;
    label = isOriginalTrusted
      ? 'From trusted outlet but limited cross-referencing available'
      : 'Limited sources found, verification pending';
  } else {
    verification_status = 'Single Source';
    confidence_score = 20;
    label = 'No corroborating sources found';
  }

  return {
    title: '',
    corroborating_sources: corroboratingSources.slice(0, 8),
    source_count: totalSources,
    verification_status,
    confidence_score,
    label,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const articles: { title: string; source: string }[] = body.articles;

    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ success: false, error: 'No articles provided' }, { status: 400 });
    }

    cleanCache();

    // Process up to 10 articles at a time to avoid overloading
    const toVerify = articles.slice(0, 10);
    const results: VerificationResult[] = [];

    // Check cache first, then verify remaining
    const uncached: { index: number; title: string; source: string }[] = [];

    for (let i = 0; i < toVerify.length; i++) {
      const cacheKey = toVerify[i].title.toLowerCase().trim().slice(0, 80);
      const cached = verificationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results[i] = cached.result;
      } else {
        uncached.push({ index: i, ...toVerify[i] });
      }
    }

    // Verify uncached articles in parallel (max 5 concurrent)
    const batchSize = 5;
    for (let b = 0; b < uncached.length; b += batchSize) {
      const batch = uncached.slice(b, b + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          const { sources } = await searchForCorroboration(item.title);
          // Remove the original source from corroborating list
          const originalDomain = (() => {
            try { return item.source.replace('www.', ''); } catch { return ''; }
          })();
          const corroborating = sources.filter(s => s !== originalDomain);

          const verification = computeVerification(item.source, corroborating);
          verification.title = item.title;
          return { index: item.index, result: verification };
        })
      );

      for (const res of batchResults) {
        if (res.status === 'fulfilled') {
          results[res.value.index] = res.value.result;
          const cacheKey = toVerify[res.value.index].title.toLowerCase().trim().slice(0, 80);
          verificationCache.set(cacheKey, { result: res.value.result, timestamp: Date.now() });
        }
      }
    }

    // Fill any gaps with defaults
    for (let i = 0; i < toVerify.length; i++) {
      if (!results[i]) {
        results[i] = {
          title: toVerify[i].title,
          corroborating_sources: [],
          source_count: 0,
          verification_status: 'Unverified',
          confidence_score: 25,
          label: 'Verification unavailable',
        };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
