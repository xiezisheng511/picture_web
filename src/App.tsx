import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import TopBannerAd from './components/layout/TopBannerAd';

// Lazy load pages for code splitting
const Home = lazy(() => import('./routes/Home'));
const BgColor = lazy(() => import('./routes/BgColor'));
const RemoveWatermark = lazy(() => import('./routes/RemoveWatermark'));
const Edit = lazy(() => import('./routes/Edit'));
const AiCutout = lazy(() => import('./routes/AiCutout'));
const About = lazy(() => import('./routes/About'));
const Privacy = lazy(() => import('./routes/Privacy'));
const Terms = lazy(() => import('./routes/Terms'));

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="animate-pulse text-gray-400">Loading…</div>
    </div>
  );
}

export default function App() {
  return (
    <>
      {/* Top banner ad slot - replace with AdSense code after approval */}
      <TopBannerAd />

      <Header />

      <main className="flex-1">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools/bg-color" element={<BgColor />} />
            <Route path="/tools/remove-watermark" element={<RemoveWatermark />} />
            <Route path="/tools/edit" element={<Edit />} />
            <Route path="/tools/ai-cutout" element={<AiCutout />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </>
  );
}