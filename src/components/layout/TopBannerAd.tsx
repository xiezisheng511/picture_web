import AdSlot from './AdSlot';

export default function TopBannerAd() {
  return (
    <div className="w-full bg-gray-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
        <AdSlot size="banner" />
      </div>
    </div>
  );
}