import { describe, it, expect } from 'vitest';
import { TOOLS } from '../src/lib/tools';

describe('TOOLS catalog', () => {
  it('contains 4 tools', () => {
    expect(TOOLS).toHaveLength(4);
  });

  it('has unique ids', () => {
    const ids = TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has both zh and en titles and descriptions', () => {
    for (const tool of TOOLS) {
      expect(tool.zhTitle.length).toBeGreaterThan(0);
      expect(tool.enTitle.length).toBeGreaterThan(0);
      expect(tool.zhDesc.length).toBeGreaterThan(0);
      expect(tool.enDesc.length).toBeGreaterThan(0);
      expect(tool.path.startsWith('/tools/')).toBe(true);
    }
  });
});