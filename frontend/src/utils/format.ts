export const euro = (value?: number | null) => value == null ? '–' : `${value.toFixed(2).replace('.', ',')} €`;
export const distance = (value?: number) => value == null ? '' : value < 1 ? `${Math.round(value * 1000)} m` : `${value.toFixed(1).replace('.', ',')} km`;
export const updated = (iso?: string | null) => iso ? new Intl.DateTimeFormat('fi-FI', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Helsinki' }).format(new Date(iso)) : 'Ei tietoa';

export function sourceLabel(url?: string | null) {
  if (!url) return 'Ei tietoa';
  if (url.includes('unica.fi')) return 'Unica';
  if (url.includes('sodexo.fi')) return 'Sodexo';
  if (url.includes('karkafeerna.fi')) return 'Kårkaféerna';
  if (url.includes('juvenes.fi')) return 'Juvenes';
  if (url.includes('aromimenu') || url.includes('kaarea')) return 'Kaarea';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Ruokalistan tarjoaja';
  }
}
