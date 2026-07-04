import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('nav.about')}</h1>
      <div className="prose prose-gray space-y-4 text-gray-700">
        <p>
          <strong>PicEdit</strong> 是一款完全免费的浏览器图片处理工具，专注于"换底色"、"去水印"、"一键抠图"等高频场景。
        </p>
        <p>
          与其他在线图片工具不同，PicEdit 默认情况下<strong>所有处理都在你的浏览器本地完成</strong>，
          你的图片文件永远不会上传到任何服务器。我们相信隐私是基本权利。
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-8">核心特性</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>🔒 文件不上传服务器（默认所有工具）</li>
          <li>⚡ 浏览器本地运算，秒级响应</li>
          <li>🆓 完全免费，无水印、无注册</li>
          <li>🌐 中英双语支持</li>
          <li>🤖 可选 AI 高精度抠图（remove.bg）</li>
        </ul>
        <h2 className="text-xl font-semibold text-gray-900 mt-8">联系我们</h2>
        <p>如有问题或建议，欢迎通过页面底部的"联系我们"链接反馈。</p>
      </div>
    </div>
  );
}