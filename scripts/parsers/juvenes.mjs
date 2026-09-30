import { htmlToText } from './html.mjs';

function price(text, pattern) {
  const match = text.match(pattern);
  return match?.[1] ? Number(match[1].replace(',', '.')) : null;
}

function parseDiets(value) {
  const upper = value.toUpperCase();
  const diets = new Set();
  if (/(^|[, (])G($|[, )])/.test(upper)) diets.add('GLUTEN_FREE');
  if (/(^|[, (])L($|[, )])/.test(upper)) diets.add('LACTOSE_FREE');
  if (/(^|[, (])M($|[, )])/.test(upper)) diets.add('DAIRY_FREE');
  if (/\bVEG\b|VEGAAN/.test(upper)) { diets.add('VEGAN'); diets.add('VEGETARIAN'); }
  return [...diets];
}

export function parseJuvenesHtml(html) {
  const text = htmlToText(html);
  const studentPrice = price(text, /Buffet,\s*opiskelijat\s*(\d+[,.]\d{1,2})\s*€/i);
  const premiumPrice = price(text, /Fusion Kitchen,\s*opiskelijat\s*(\d+[,.]\d{1,2})\s*€/i);
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex((line) => /Block lounaslista/i.test(line));
  const end = lines.findIndex((line, index) => index > start && /Erityisruokavaliomerkinnät/i.test(line));
  const section = start >= 0 ? lines.slice(start + 1, end > start ? end : start + 120) : [];
  let category = 'LOUNAS';
  const meals = [];

  for (const line of section) {
    if (/^[A-ZÄÖÅ][A-ZÄÖÅ\s-]{2,30}$/.test(line) && !/LUNCH|LOUNASLISTA/i.test(line)) {
      category = line;
      continue;
    }
    if (/\b(?:G|L|M|Mu|VEG)(?:[, )]|$)/i.test(line) && line.length < 180 && !/^G\s*=|^L\s*=|^M\s*=|^Mu\s*=|^VEG\s*=/i.test(line)) {
      const name = line.replace(/\s+(?:G|L|M|Mu|VEG)(?:\s*,\s*(?:G|L|M|Mu|VEG))*.*$/i, '').replace(/^[-*]\s*/, '').trim();
      if (name && name.length > 2) meals.push({ name, category, studentPrice, diets: parseDiets(line), allergens: [] });
    }
  }

  return { meals: meals.slice(0, 30), studentPrice, premiumPrice };
}
