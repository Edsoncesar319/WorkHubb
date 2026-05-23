/** Formatação de datas em pt-BR (fuso America/Sao_Paulo) */

const LOCALE = 'pt-BR';
const TIME_ZONE = 'America/Sao_Paulo';

/** ISO / timestamp — null se inválido */
export function parseInstant(
  value: string | Date | null | undefined
): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const s = String(value).trim();
  if (!s) return null;

  // input type="month" → YYYY-MM (evita bug UTC que mostra mês anterior)
  const monthOnly = s.match(/^(\d{4})-(\d{2})$/);
  if (monthOnly) {
    const year = Number(monthOnly[1]);
    const month = Number(monthOnly[2]);
    if (month >= 1 && month <= 12) {
      return new Date(year, month - 1, 1, 12, 0, 0, 0);
    }
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseMonth(
  value: string | null | undefined
): { year: number; month: number } | null {
  if (!value) return null;
  const s = String(value).trim();
  const match = s.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const d = parseInstant(s);
  if (!d) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function normalizeMonthInput(value: string): string | null {
  const trimmed = value.trim();
  return /^\d{4}-\d{2}$/.test(trimmed) ? trimmed : null;
}

export function formatMonthYear(value: string | null | undefined): string {
  const p = parseMonth(value);
  if (!p) return value?.trim() ? String(value) : '—';
  const d = new Date(p.year, p.month - 1, 1);
  return d.toLocaleDateString(LOCALE, {
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

export function formatExperiencePeriod(
  start: string,
  end?: string | null,
  current?: boolean
): string {
  const startLabel = formatMonthYear(start);
  if (current) return `${startLabel} — Atual`;
  if (end?.trim()) return `${startLabel} — ${formatMonthYear(end)}`;
  return startLabel;
}

export function formatExperienceDuration(
  start: string,
  end?: string | null,
  current?: boolean
): string | null {
  const ps = parseMonth(start);
  if (!ps) return null;

  const now = new Date();
  const pe = current
    ? { year: now.getFullYear(), month: now.getMonth() + 1 }
    : parseMonth(end ?? null);
  if (!pe) return null;

  let months = (pe.year - ps.year) * 12 + (pe.month - ps.month) + 1;
  if (months < 1) return null;

  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ano${years > 1 ? 's' : ''}`);
  if (rem > 0) parts.push(`${rem} ${rem > 1 ? 'meses' : 'mês'}`);
  return parts.length > 0 ? parts.join(' e ') : null;
}

/** Ex.: 22 de maio de 2025 */
export function formatDateLong(value: string | Date | null | undefined): string {
  const d = parseInstant(value);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

/** Ex.: 22/05/2025 */
export function formatDateShort(value: string | Date | null | undefined): string {
  const d = parseInstant(value);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

/** Ex.: 22 de mai. de 2025, 14:30 */
export function formatDateTime(value: string | Date | null | undefined): string {
  const d = parseInstant(value);
  if (!d) return '—';
  return d.toLocaleString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  });
}

/** Ex.: Hoje, 14:30 | Ontem, 09:00 | 3 dias atrás */
export function formatRelativeDateTime(
  value: string | Date | null | undefined
): string {
  const d = parseInstant(value);
  if (!d) return '—';

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = startOfToday.getTime() - startOfDate.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  const time = d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  });

  if (diffDays === 0) return `Hoje, ${time}`;
  if (diffDays === 1) return `Ontem, ${time}`;
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} dias atrás, ${time}`;
  }

  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleString(LOCALE, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TIME_ZONE,
    });
  }

  return formatDateTime(d);
}

export function isWithinLastDays(
  value: string | Date | null | undefined,
  days: number
): boolean {
  const d = parseInstant(value);
  if (!d) return false;
  const limit = new Date();
  limit.setHours(0, 0, 0, 0);
  limit.setDate(limit.getDate() - days);
  return d >= limit;
}

export function compareInstants(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined
): number {
  const da = parseInstant(a);
  const db = parseInstant(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return db.getTime() - da.getTime();
}

export function compareMonthStrings(a: string, b: string): number {
  const pa = parseMonth(a);
  const pb = parseMonth(b);
  if (!pa && !pb) return 0;
  if (!pa) return 1;
  if (!pb) return -1;
  if (pa.year !== pb.year) return pb.year - pa.year;
  return pb.month - pa.month;
}

export function toISOString(value: Date | string | null | undefined): string {
  const d = parseInstant(value ?? null);
  return d ? d.toISOString() : '';
}
