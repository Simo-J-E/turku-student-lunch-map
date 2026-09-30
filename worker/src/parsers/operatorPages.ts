import { htmlToText } from './unica';

function firstNumber(pattern: RegExp, text: string) {
  const match = text.match(pattern);
  return match?.[1] ? Number(match[1].replace(',', '.')) : null;
}

export function parseOperatorPriceHtml(html: string, url: string) {
  const text = htmlToText(html);

  if (url.includes('juvenes.fi')) {
    return {
      meals: [],
      studentPrice: firstNumber(/Buffet,\s*opiskelijat\s*(\d+[,.]\d{1,2})\s*€/i, text),
      premiumPrice: firstNumber(/Fusion Kitchen,\s*opiskelijat\s*(\d+[,.]\d{1,2})\s*€/i, text),
    };
  }

  if (url.includes('karkafeerna.fi')) {
    return {
      meals: [],
      studentPrice: firstNumber(/Normaali lounas[\s\S]{0,100}?Opiskelijat\s*(\d+[,.]\d{1,2})\s*€/i, text),
      premiumPrice: firstNumber(/Erikoislounas[\s\S]{0,100}?Opiskelijat\s*(\d+[,.]\d{1,2})\s*€/i, text),
    };
  }

  return { meals: [], studentPrice: null, premiumPrice: null };
}
