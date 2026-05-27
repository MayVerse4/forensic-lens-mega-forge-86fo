import { NextResponse } from 'next/server';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
}

async function scrapeGoogleNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  try {
    const res = await fetch(
      'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 120 },
      }
    );

    if (res.ok) {
      const xml = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;

      while ((match = itemRegex.exec(xml)) !== null && allItems.length < 20) {
        const itemXml = match[1];

        const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
          itemXml.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
        const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
          itemXml.match(/<description>([\s\S]*?)<\/description>/);
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

        const title = (titleMatch?.[1] || '').replace(/<[^>]*>/g, '').trim();
        const url = (linkMatch?.[1] || '').trim();
        const rawDesc = (descMatch?.[1] || '').replace(/<[^>]*>/g, '').trim();
        const publishedAt = pubDateMatch?.[1] || '';
        const source = (sourceMatch?.[1] || '').replace(/<[^>]*>/g, '').trim();

        if (!title || !url) continue;

        const imgMatch = (descMatch?.[1] || '').match(/<img[^>]*src="([^"]+)"/);
        const image = imgMatch?.[1] || null;

        const hostname = (() => {
          try {
            return new URL(url).hostname.replace('www.', '');
          } catch {
            return source || 'web';
          }
        })();

        allItems.push({
          title,
          description: rawDesc.slice(0, 200),
          url,
          image,
          source: source || hostname,
          publishedAt,
        });
      }
    }
  } catch {
    // Google News failed, try DuckDuckGo fallback
  }

  if (allItems.length < 5) {
    try {
      const ddgItems = await fetchDuckDuckGoNews();
      allItems.push(...ddgItems);
    } catch {
      // DuckDuckGo also failed
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, 20);
}

async function fetchDuckDuckGoNews(): Promise<NewsItem[]> {
  const queries = ['latest breaking news today', 'top trending news'];
  const allItems: NewsItem[] = [];

  for (const query of queries) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const res = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          next: { revalidate: 300 },
        }
      );

      if (!res.ok) continue;
      const html = await res.text();

      const resultRegex =
        /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
      const snippetRegex =
        /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      const iconRegex =
        /<img[^>]*class="result__icon__img"[^>]*src="([^"]*)"/g;

      let m;
      const titles: { title: string; url: string }[] = [];
      const snippets: string[] = [];
      const icons: string[] = [];

      while ((m = resultRegex.exec(html)) !== null) {
        const rawUrl = m[1] || '';
        const title = (m[2] || '')
          .replace(/<[^>]*>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .trim();

        let url = rawUrl;
        const uddgMatch = rawUrl.match(/uddg=([^&]*)/);
        if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);

        if (title && url) titles.push({ title, url });
      }

      while ((m = snippetRegex.exec(html)) !== null) {
        const snippet = (m[1] || '')
          .replace(/<[^>]*>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .trim();
        snippets.push(snippet);
      }

      while ((m = iconRegex.exec(html)) !== null) {
        icons.push(m[1] || '');
      }

      for (let i = 0; i < Math.min(titles.length, 10); i++) {
        const hostname = (() => {
          try {
            return new URL(titles[i].url).hostname.replace('www.', '');
          } catch {
            return 'web';
          }
        })();

        const iconUrl = icons[i] || null;
        const image = iconUrl && iconUrl.startsWith('//') ? `https:${iconUrl}` : iconUrl;

        allItems.push({
          title: titles[i].title,
          description: snippets[i] || '',
          url: titles[i].url,
          image: image && image.includes('icon') ? null : image,
          source: hostname,
          publishedAt: new Date().toISOString(),
        });
      }
    } catch {
      continue;
    }
  }

  return allItems;
}

export async function GET() {
  try {
    const news = await scrapeGoogleNews();
    return NextResponse.json({ success: true, data: news, fetchedAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
