export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">服务条款 / Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">最后更新：2026-07-04 / Last updated: 2026-07-04</p>

      <div className="prose prose-gray space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. 服务说明</h2>
          <p>
            PicEdit 提供基于浏览器的图片处理工具，包括但不限于：背景颜色替换、水印去除、图片裁剪、AI 抠图等。
            服务"按现状"提供，不承诺特定可用性或结果。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. 用户行为</h2>
          <p>
            您不应使用本服务处理侵权、色情、暴力或其他违法内容。对于 AI 抠图功能，请勿上传包含他人肖像的敏感图片，除非您已获得合法授权。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. 知识产权</h2>
          <p>
            您保留上传图片的全部权利。我们不主张对您的图片拥有任何权利。处理结果直接下载至您的设备，不在服务器留存。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. 免责声明</h2>
          <p>
            本服务不对处理结果的质量、可用性做任何明示或暗示的保证。对于使用本服务造成的任何损失，本站不承担责任。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. 条款变更</h2>
          <p>
            我们可能不定期更新本条款。重大变更将通过页面公告。继续使用服务即视为接受更新后的条款。
          </p>
        </section>
      </div>
    </div>
  );
}