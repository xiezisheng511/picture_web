import { describe, it, expect } from 'vitest';
import i18n from '../src/i18n';

describe('i18n', () => {
  it('has both languages loaded', () => {
    expect(i18n.hasResourceBundle('zh', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
  });

  it('translates site name in zh', async () => {
    await i18n.changeLanguage('zh');
    expect(i18n.t('site.name')).toBe('PicEdit');
    expect(i18n.t('home.heroTitle')).toContain('图片处理');
  });

  it('translates site name in en', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('home.heroTitle')).toContain('photo editor');
  });
});