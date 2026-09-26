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

export const economicCalendarService = {
  async fetchEvents(): Promise<EconomicEvent[]> {
    try {
      const res = await fetch(DIRECT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: DIRECT_KEY }),
      });

      if (!res.ok) {
        throw new Error(`Economic API HTTP ${res.status}`);
      }

      const json = await res.json();
      const rawEvents = json?.events || json?.data?.events || [];

      if (Array.isArray(rawEvents) && rawEvents.length > 0) {
        // Map and sort events
        const mapped: EconomicEvent[] = rawEvents.map((ev: any, idx: number) => {
          const countryCode = ev.source?.country || ev.country || ev.currency || 'USD';
          const flag = getFlagForCountry(countryCode);
          const relativeTime = formatEventRelativeTime(ev.eventDate, ev.eventTime);
          return {
            id: ev.id || `ev-${idx}`,
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

        // Sort so that upcoming / newest events appear first
        mapped.sort((a, b) => {
          const dateA = new Date(`${a.eventDate}T${a.eventTime || '00:00'}:00`).getTime();
          const dateB = new Date(`${b.eventDate}T${b.eventTime || '00:00'}:00`).getTime();
          return dateB - dateA;
        });

        return mapped.slice(0, 20);
      }
    } catch (e) {
      console.warn('economicCalendarService.fetchEvents failed:', e);
    }

    return [];
  },
};
