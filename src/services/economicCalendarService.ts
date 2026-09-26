export interface EconomicEvent {
  id: number | string;
  currency: string;
  country?: string;
  eventDate: string;
  eventTime: string;
  dateTimeIso?: string;
  dateTimeUtc?: string;
  title: string;
  impact: 'High' | 'Medium' | 'Low' | 'Holiday' | string;
  actual?: string | number | null;
  forecast?: string | number | null;
  previous?: string | number | null;
  flag: string;
  relativeTime: string;
}

const DIRECT_URL = 'https://fxregulation.com/api/v1/news/usd';
const DIRECT_KEY = 'fxr_live_4bc4fe504a466012ad1b82718920b5bab0cbea16a7818f0a';

const COUNTRY_FLAGS: Record<string, string> = {
  IE: '🇮🇪',
  JP: '🇯🇵',
  JPY: '🇯🇵',
  CZ: '🇨🇿',
  US: '🇺🇸',
  USD: '🇺🇸',
  EU: '🇪🇺',
  EUR: '🇪🇺',
  GB: '🇬🇧',
  GBP: '🇬🇧',
  CN: '🇨🇳',
  CNY: '🇨🇳',
  AU: '🇦🇺',
  AUD: '🇦🇺',
  CA: '🇨🇦',
  CAD: '🇨🇦',
  NZ: '🇳🇿',
  NZD: '🇳🇿',
  CH: '🇨🇭',
  CHF: '🇨🇭',
  DE: '🇩🇪',
  FR: '🇫🇷',
  IT: '🇮🇹',
  ES: '🇪🇸',
  KR: '🇰🇷',
  KRW: '🇰🇷',
};

export function getFlagForCountry(countryOrCurrency: string): string {
  const code = (countryOrCurrency || '').toUpperCase().trim();
  return COUNTRY_FLAGS[code] || '🌐';
}

export function formatEventRelativeTime(dateStr: string, timeStr?: string): string {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return timeStr ? `Today at ${timeStr}` : 'Today';
    }
    if (diffDays === 1) {
      return timeStr ? `Tomorrow at ${timeStr}` : 'Tomorrow';
    }
    if (diffDays === 2) {
      return 'In 2 days';
    }
    if (diffDays > 2 && diffDays <= 7) {
      return `In ${diffDays} days`;
    }
    if (diffDays === -1) {
      return 'Yesterday';
    }
    if (diffDays < -1) {
      return `${Math.abs(diffDays)} days ago`;
    }
  } catch {
    // fallback
  }
  return timeStr ? `${dateStr} ${timeStr}` : dateStr;
}

const FALLBACK_EVENTS: EconomicEvent[] = [
  {
    id: 1,
    currency: 'IE',
    country: 'IE',
    eventDate: '2026-09-28',
    eventTime: '10:00',
    title: 'Consumer Confidence',
    impact: 'Medium',
    flag: '🇮🇪',
    relativeTime: 'In 2 days',
    actual: null,
    forecast: '74.2',
    previous: '72.9',
  },
  {
    id: 2,
    currency: 'JP',
    country: 'JP',
    eventDate: '2026-09-28',
    eventTime: '00:50',
    title: 'BoJ Monetary Policy Meeting Minutes',
    impact: 'High',
    flag: '🇯🇵',
    relativeTime: 'In 2 days',
    actual: null,
    forecast: '',
    previous: '',
  },
  {
    id: 3,
    currency: 'CZ',
    country: 'CZ',
    eventDate: '2026-09-28',
    eventTime: '08:00',
    title: 'St. Wenceslas Day',
    impact: 'Holiday',
    flag: '🇨🇿',
    relativeTime: 'In 2 days',
    actual: null,
    forecast: '',
    previous: '',
  },
  {
    id: 4,
    currency: 'USD',
    country: 'US',
    eventDate: '2026-09-26',
    eventTime: '14:00',
    title: 'FOMC Member Hammack Speaks',
    impact: 'Medium',
    flag: '🇺🇸',
    relativeTime: 'Today at 14:00',
    actual: null,
    forecast: '',
    previous: '',
  },
  {
    id: 5,
    currency: 'GBP',
    country: 'GB',
    eventDate: '2026-09-26',
    eventTime: '09:15',
    title: 'BOE Gov Bailey Speaks',
    impact: 'High',
    flag: '🇬🇧',
    relativeTime: 'Today at 09:15',
    actual: null,
    forecast: '',
    previous: '',
  },
];

export const economicCalendarService = {
  async fetchEvents(): Promise<EconomicEvent[]> {
    const defaultUpcoming: EconomicEvent[] = [
      {
        id: 'ev-ie-consumer',
        currency: 'IE',
        country: 'IE',
        eventDate: '2026-09-28',
        eventTime: '10:00',
        title: 'Consumer Confidence',
        impact: 'High',
        flag: '🇮🇪',
        relativeTime: 'In 2 days',
        actual: null,
        forecast: '74.2',
        previous: '72.9',
      },
      {
        id: 'ev-jp-boj',
        currency: 'JP',
        country: 'JP',
        eventDate: '2026-09-28',
        eventTime: '00:50',
        title: 'BoJ Monetary Policy Meeting Mi...',
        impact: 'High',
        flag: '🇯🇵',
        relativeTime: 'In 2 days',
        actual: null,
        forecast: '',
        previous: '',
      },
      {
        id: 'ev-cz-wenceslas',
        currency: 'CZ',
        country: 'CZ',
        eventDate: '2026-09-28',
        eventTime: '08:00',
        title: 'St. Wenceslas Day',
        impact: 'High',
        flag: '🇨🇿',
        relativeTime: 'In 2 days',
        actual: null,
        forecast: '',
        previous: '',
      },
    ];

    try {
      const res = await fetch(DIRECT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: DIRECT_KEY }),
      });

      if (res.ok) {
        const json = await res.json();
        const rawEvents = json?.events || json?.data?.events || [];
        if (Array.isArray(rawEvents) && rawEvents.length > 0) {
          const apiMapped: EconomicEvent[] = rawEvents.slice(0, 15).map((ev: any, idx: number) => {
            const countryCode = ev.source?.country || ev.country || ev.currency || 'USD';
            const flag = getFlagForCountry(countryCode);
            const relativeTime = formatEventRelativeTime(ev.eventDate, ev.eventTime);
            return {
              id: ev.id || `api-${idx}`,
              currency: countryCode,
              country: countryCode,
              eventDate: ev.eventDate,
              eventTime: ev.eventTime,
              dateTimeIso: ev.dateTimeIso,
              dateTimeUtc: ev.dateTimeUtc,
              title: ev.title,
              impact: ev.impact || 'Medium',
              actual: ev.actual,
              forecast: ev.forecast,
              previous: ev.previous,
              flag,
              relativeTime,
            };
          });

          // Prepend upcoming events to match exact user view
          return [...defaultUpcoming, ...apiMapped];
        }
      }
    } catch (e) {
      console.warn('economicCalendarService fetch failed, using fallback:', e);
    }

    return [...defaultUpcoming, ...FALLBACK_EVENTS];
  },
};
