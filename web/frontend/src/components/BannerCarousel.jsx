import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BannerCarousel({ banners = [] }) {
  const [i, setI] = useState(0);
  const n = banners.length;
  const go = useCallback((d) => setI((p) => (p + d + n) % n), [n]);

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return <div className="rounded-lg bg-gray-200 h-[240px] sm:h-[320px] animate-pulse" />;

  return (
    <div data-testid="home-carousel" className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm h-[240px] sm:h-[320px] group">
      {banners.map((b, idx) => (
        <div key={idx} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: idx === i ? 1 : 0 }}>
          <img src={b.img} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/85 via-red-800/40 to-transparent" />
          <div className="relative p-6 sm:p-10 flex flex-col justify-center h-full max-w-md">
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2 drop-shadow">{b.title}</h2>
            <p className="text-white/80 text-sm mb-4">{b.sub}</p>
            <Link to={b.to} className="inline-flex w-fit items-center gap-2 h-10 px-5 rounded-md bg-amber-400 hover:bg-amber-500 text-red-900 font-black transition-all active:scale-95">立即查看</Link>
          </div>
        </div>
      ))}

      <button data-testid="carousel-prev" onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button data-testid="carousel-next" onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-amber-400" : "w-1.5 bg-white/60"}`} />
        ))}
      </div>
    </div>
  );
}
