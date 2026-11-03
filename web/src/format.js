export function inr(value) {
  const n = Math.round(Number(value) || 0);
  return `₹${n.toLocaleString('en-IN')}`;
}

export function km(meters) {
  const n = (Number(meters) || 0) / 1000;
  if (n < 1) return `${Math.round(n * 1000)} m`;
  return `${n.toFixed(n < 10 ? 1 : 0)} km`;
}

export function duration(seconds) {
  const mins = Math.round((Number(seconds) || 0) / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function timeOf(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function dayOf(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function whenLabel(iso) {
  if (!iso) return '';
  return `${dayOf(iso)}, ${timeOf(iso)}`;
}

export function relativeWhen(iso) {
  const diff = (new Date(iso).getTime() - Date.now()) / 60000;
  const abs = Math.abs(diff);
  const text =
    abs < 60
      ? `${Math.max(1, Math.round(abs))} min`
      : abs < 1440
        ? `${Math.round(abs / 60)} hr`
        : `${Math.round(abs / 1440)} day${Math.round(abs / 1440) === 1 ? '' : 's'}`;
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function pct(fraction) {
  return `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
}

export function scoreLabel(score) {
  if (score >= 0.72) return 'Great match';
  if (score >= 0.5) return 'Good match';
  return 'Possible match';
}

export function defaultDeparture() {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function toIso(date, time) {
  const d = new Date(`${date}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function firstName(name = '') {
  return name.split(/\s+/)[0] || name;
}
