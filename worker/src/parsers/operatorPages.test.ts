import { describe, expect, it } from 'vitest';
import { parseOperatorPriceHtml } from './operatorPages';

describe('parseOperatorPriceHtml', () => {
  it('parses Juvenes student prices', () => {
    const parsed = parseOperatorPriceHtml(
      '<div>Buffet, opiskelijat 3,10 €</div><div>Fusion Kitchen, opiskelijat 5,90 €</div>',
      'https://juvenes.fi/block/',
    );
    expect(parsed.studentPrice).toBe(3.1);
    expect(parsed.premiumPrice).toBe(5.9);
  });

  it('parses Kårkaféerna student prices', () => {
    const parsed = parseOperatorPriceHtml(
      '<h2>Normaali lounas</h2><p>Opiskelijat 3,10 €</p><h2>Erikoislounas</h2><p>Opiskelijat 5,90 €</p>',
      'https://www.karkafeerna.fi/fi/lounas/',
    );
    expect(parsed.studentPrice).toBe(3.1);
    expect(parsed.premiumPrice).toBe(5.9);
  });

});
