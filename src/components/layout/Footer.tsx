import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-100 bg-gray-50 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="PicEdit" className="w-6 h-6" />
            <span className="text-sm text-gray-600">{t('footer.copyright')}</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/privacy" className="text-gray-600 hover:text-primary-600">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-primary-600">
              {t('footer.terms')}
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-primary-600">
              {t('footer.contact')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}