export const euro = (value?: number | null) => value == null ? '–' : `${value.toFixed(2).replace('.', ',')} €`;
export const distance = (value?: number) => value == null ? '' : value < 1 ? `${Math.round(value * 1000)} m` : `${value.toFixed(1).replace('.', ',')} km`;
export const updated = (iso?: string | null) => iso ? new Intl.DateTimeFormat('fi-FI', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Helsinki' }).format(new Date(iso)) : 'Ei tietoa';
