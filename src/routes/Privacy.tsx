export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">隐私政策 / Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">最后更新：2026-07-04 / Last updated: 2026-07-04</p>

      <div className="prose prose-gray space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. 数据处理</h2>
          <p>
            PicEdit 的所有图片处理功能默认在用户浏览器本地完成。除非用户主动选择使用"AI 一键抠图"功能（其图片会上传至 remove.bg 服务），您的图片文件不会上传到 PicEdit 或任何第三方服务器。
          </p>
          <p className="mt-2">
            <strong>EN:</strong> All image processing happens locally in your browser by default.
            Files are never uploaded to PicEdit or third-party servers, except when you explicitly use
            the "AI Cutout" feature, which sends your image to remove.bg.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Cookies</h2>
          <p>
            我们使用 localStorage 仅存储语言偏好和（可选的）API Key。我们不使用跟踪性 cookies。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. 第三方服务 / Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>remove.bg</strong>：AI 抠图功能调用方，仅在用户主动启用时上传图片。
            </li>
            <li>
              <strong>Google AdSense</strong>：广告服务，可能使用 cookies 投放个性化广告。
            </li>
            <li>
              <strong>Google Fonts</strong>：加载英文字体。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. 广告 / Advertising</h2>
          <p>
            本站通过 Google AdSense 展示广告。Google 可能使用 cookies 投放与您兴趣相关的广告。
            您可以访问
            <a href="https://www.google.com/settings/ads" className="text-primary-600 underline mx-1">
              Google Ads Settings
            </a>
            选择停用个性化广告。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. 联系 / Contact</h2>
          <p>
            如对隐私政策有疑问，请通过页面底部的联系方式与我们联系。
          </p>
        </section>
      </div>
    </div>
  );
}