export interface MarketNewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  timeAgo: string;
  symbolTag?: string;
  symbolChange?: string;
  isPositive?: boolean;
  imageUrl: string;
  summary: string;
  content: string;
}

export const TOP_NEWS_ARTICLES: MarketNewsArticle[] = [
  {
    id: 'news-near',
    title: 'NEAR reclaims $5 as Bitwise ETF clears key regulatory hurdle',
    source: 'CoinDesk',
    publishedAt: '2026-09-26T07:15:00Z',
    timeAgo: '1 hour ago',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=300&q=80',
    summary:
      'NEAR Protocol gained strong upward momentum following regulatory progress on the Bitwise multi-asset ETF application.',
    content:
      'NEAR Protocol experienced significant buying activity during early trading sessions, reclaiming the $5 psychological barrier. Market participants welcomed the advancement of crypto ETF filings that include proof-of-stake layer-1 assets, signaling institutional interest broadening beyond Bitcoin and Ethereum.',
  },
  {
    id: 'news-usdkrw',
    title: 'South Korean Won: Export strength supports KRW – Societe Generale',
    source: 'ForexLive',
    publishedAt: '2026-09-26T03:30:00Z',
    timeAgo: '5 hours ago',
    symbolTag: 'USDKRW',
    symbolChange: '0.00%',
    isPositive: true,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
    summary:
      'Societe Generale analysts noted resilience in the South Korean Won, supported by robust tech semiconductor shipments.',
    content:
      'The South Korean Won held steady against the dollar as regional export data indicated persistent demand for artificial intelligence hardware and memory chips. Economists expect the Bank of Korea to maintain a balanced monetary stance while monitoring global currency dynamics.',
  },
  {
    id: 'news-eth',
    title: 'Ethereum Price Forecast: ETH holds steady despite weakening volume',
    source: 'MarketWatch',
    publishedAt: '2026-09-26T03:15:00Z',
    timeAgo: '5 hours ago',
    symbolTag: 'ETH',
    symbolChange: '0.03%',
    isPositive: false,
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=300&q=80',
    summary:
      'Ethereum consolidated around key support levels as on-chain transaction volumes stabilized across major Layer-2 networks.',
    content:
      'Ethereum traders observed compressed intraday ranges, with bulls successfully defending crucial technical floor zones. Low gas fees across the network have spurred sustained decentralized finance activity even as spot derivatives open interest remains cautious.',
  },
  {
    id: 'news-xau',
    title: 'Gold consolidates near all-time peak on geopolitical hedges',
    source: 'Kitco News',
    publishedAt: '2026-09-26T02:00:00Z',
    timeAgo: '6 hours ago',
    symbolTag: 'XAUUSD',
    symbolChange: '0.68%',
    isPositive: true,
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=300&q=80',
    summary:
      'Precious metals experienced consistent safe-haven demand as central banks expanded bullion reserves.',
    content:
      'Gold held strong near historic highs, buoyed by macro interest rate expectations and continuing portfolio diversification into sovereign reserve assets. Technical analysts maintain an optimistic intermediate outlook while price trades above the $2,640 support band.',
  },
  {
    id: 'news-btc',
    title: 'Bitcoin approaches new milestone as global liquidity surges',
    source: 'Bloomberg Crypto',
    publishedAt: '2026-09-26T05:00:00Z',
    timeAgo: '3 hours ago',
    symbolTag: 'BTC',
    symbolChange: '1.42%',
    isPositive: true,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
    summary:
      'Institutional ETF inflows accelerated for the third consecutive day as institutional capital allocated to digital assets.',
    content:
      'Bitcoin rallied firmly through resistance zones, driven by positive liquidity indicators across global capital markets. Spot ETFs registered net inflows exceeding $300M, validating strong continuous appetite from institutional hedge funds and treasury managers.',
  },
];
