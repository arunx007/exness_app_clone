export interface MarketNewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  timeAgo: string;
  symbolTag?: string;
  imageUrl: string;
  summary: string;
  content: string;
  url: string;
}

function decodeEntities(text: string): string {
  return String(text || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2019;/g, "'")
    .replace(/&#x2018;/g, "'")
    .replace(/&#x201C;/g, '"')
    .replace(/&#x201D;/g, '"')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function formatRelativeTime(isoString: string): string {
  try {
    const ts = new Date(isoString).getTime();
    if (!Number.isFinite(ts)) return 'Recently';
    const diffMs = Date.now() - ts;
    if (diffMs < 0) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'Recently';
  }
}

function inferSymbol(title: string): string | undefined {
  const lower = title.toLowerCase();
  if (lower.includes('bitcoin') || lower.includes('btc')) return 'BTC';
  if (lower.includes('ethereum') || lower.includes('eth')) return 'ETH';
  if (lower.includes('gold') || lower.includes('xau')) return 'XAUUSD';
  if (lower.includes('oil') || lower.includes('brent') || lower.includes('crude')) return 'USOIL';
  if (lower.includes('solana') || lower.includes('sol')) return 'SOL';
  if (lower.includes('euro') || lower.includes('ecb')) return 'EURUSD';
  if (lower.includes('fed') || lower.includes('dollar') || lower.includes('treasury')) return 'USD';
  if (lower.includes('pound') || lower.includes('boe') || lower.includes('uk')) return 'GBPUSD';
  if (lower.includes('won') || lower.includes('korea')) return 'USDKRW';
  if (lower.includes('near')) return 'NEAR';
  return undefined;
}

export const marketNewsService = {
  async fetchTopNews(): Promise<MarketNewsArticle[]> {
    const feeds = [
      {
        name: 'CoinDesk',
        url: 'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
        defaultImg: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=300&q=80',
      },
      {
        name: 'Cointelegraph',
        url: 'https://cointelegraph.com/rss',
        defaultImg: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=300&q=80',
      },
      {
        name: 'BBC Business',
        url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
        defaultImg: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
      },
    ];

    const results: MarketNewsArticle[] = [];

    const fetchPromises = feeds.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (!res.ok) return [];

        const xml = await res.text();
        const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

        const parsed: MarketNewsArticle[] = [];
        for (const block of itemBlocks.slice(0, 4)) {
          const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
          const rawTitle = titleMatch ? decodeEntities(titleMatch[1]) : '';
          if (!rawTitle || rawTitle.toLowerCase().includes('rss')) continue;

          const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
          const url = linkMatch ? linkMatch[1].trim() : '';

          const pubMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
          const publishedAt = pubMatch ? new Date(pubMatch[1]).toISOString() : new Date().toISOString();

          const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);
          const summary = descMatch ? decodeEntities(descMatch[1]) : rawTitle;

          // Extract image from media:content or enclosure
          const mediaMatch = block.match(/<(?:media:content|enclosure)[^>]+url=["']([^"']+)["']/i);
          const imageUrl = mediaMatch ? mediaMatch[1] : feed.defaultImg;

          const symbolTag = inferSymbol(rawTitle);

          parsed.push({
            id: `news-${feed.name}-${parsed.length}-${Date.now()}`,
            title: rawTitle,
            source: feed.name,
            publishedAt,
            timeAgo: formatRelativeTime(publishedAt),
            symbolTag,
            imageUrl,
            summary,
            content: summary,
            url,
          });
        }
        return parsed;
      } catch {
        return [];
      }
    });

    const settled = await Promise.all(fetchPromises);
    for (const batch of settled) {
      results.push(...batch);
    }

    // Sort by publication time newest first
    results.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return results.slice(0, 10);
  },
};
