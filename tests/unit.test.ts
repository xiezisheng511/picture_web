import { describe, it, expect } from 'vitest';
import { hexToRgb } from '../src/lib/image/canvas';
import { fileExtension } from '../src/lib/image/edit';

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
    expect(hexToRgb('#1e40af')).toEqual([30, 64, 175]);
  });

  it('expands 3-digit hex', () => {
    expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
    expect(hexToRgb('#0f0')).toEqual([0, 255, 0]);
  });

  it('handles hex without leading #', () => {
    expect(hexToRgb('abcdef')).toEqual([0xab, 0xcd, 0xef]);
  });
});

describe('fileExtension', () => {
  it('returns correct extension for each format', () => {
    expect(fileExtension('image/png')).toBe('png');
    expect(fileExtension('image/jpeg')).toBe('jpg');
    expect(fileExtension('image/webp')).toBe('webp');
  });
});