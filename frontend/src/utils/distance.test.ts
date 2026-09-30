import { describe, expect, it } from 'vitest';
import { distanceKm } from './distance';
describe('distanceKm',()=>{it('returns roughly zero for same point',()=>expect(distanceKm(60.45,22.27,60.45,22.27)).toBe(0));});
