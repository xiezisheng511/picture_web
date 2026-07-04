import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ToolCard from '@/components/ui/ToolCard';
import Button from '@/components/ui/Button';
import AdSlot from '@/components/layout/AdSlot';
import { TOOLS } from '@/lib/tools';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Hero */}
      <section className="py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 text-accent-500 text-xs font-medium mb-6">
          {t('home.trustBadge')}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          {t('home.heroTitle')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          {t('home.heroSubtitle')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="#tools">
            <Button size="lg">{t('home.ctaPrimary')}</Button>
          </a>
          <Link to="/about">
            <Button size="lg" variant="ghost">
              {t('home.ctaSecondary')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Ad slot */}
      <section className="mb-12">
        <AdSlot size="inline" />
      </section>

      {/* Tools grid */}
      <section id="tools" className="pb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {t('home.toolsTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} {...tool} icon={tool.icon} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          {t('home.featuresTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🔒', zh: '隐私优先', en: 'Privacy first', desc: '文件不上传服务器' },
            { icon: '⚡', zh: '快速处理', en: 'Fast', desc: '浏览器本地运算，秒级完成' },
            { icon: '🆓', zh: '完全免费', en: 'Free', desc: '无注册、无水印、无限制' },
          ].map((f) => (
            <div
              key={f.en}
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-soft text-center"
            >
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900">
                {f.zh} <span className="text-gray-400 font-normal">/ {f.en}</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEO content */}
      <section className="py-12 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('home.seoTitle')}</h2>
        <p className="text-gray-700 leading-relaxed">{t('home.seoContent')}</p>
      </section>

      {/* Bottom ad */}
      <section className="py-8">
        <AdSlot size="banner" />
      </section>
    </div>
  );
}