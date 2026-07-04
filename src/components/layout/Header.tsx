import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { LANGUAGES } from '@/i18n';

export default function Header() {
  const { t, i18n } = useTranslation();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'text-primary-600 bg-primary-50'
        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="PicEdit" className="w-8 h-8" />
            <span className="font-bold text-lg text-gray-900">{t('site.name')}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/tools/bg-color" className={navLinkClass}>
              {t('tools.bgColor.title')}
            </NavLink>
            <NavLink to="/tools/remove-watermark" className={navLinkClass}>
              {t('tools.removeWatermark.title')}
            </NavLink>
            <NavLink to="/tools/edit" className={navLinkClass}>
              {t('tools.edit.title')}
            </NavLink>
            <NavLink to="/tools/ai-cutout" className={navLinkClass}>
              {t('tools.aiCutout.title')}
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              {t('nav.about')}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <select
              aria-label={t('nav.language')}
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white hover:border-primary-500 transition-colors"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}