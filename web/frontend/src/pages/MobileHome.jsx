import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api, fmt } from "@/lib/api";
import { cn } from "@/lib/utils";
import { GoldBean } from "@/components/GoldBean";
import { Megaphone, Gift, Wallet, CalendarCheck, Trophy, Volume2, Flame, ChevronRight, ChevronDown } from "lucide-react";

const IMG = {
  hero: "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/47c260ab639d42ba0372b3c5682f0679f1b2e8f777fc1e3febc0397d4e9a3fd0.jpeg",
  canada: "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/233ba08a32c1060651a1e1a9c8d354a7f5b211bddbc1711926f152dc098146d9.jpeg",
  taiwan: "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/01fe862ada64c1d1b9861c9ca0f4adb45d0d50699c8c2ca9001d2410c80bcdc5.jpeg",
  singapore: "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/60c703485713e70f03f326a5cb4ea6c17dd7c9f97e49f9d3236848456fd4b528.jpeg",
  macau: "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/d60f4f6c6122f949e9d9285646d1079941e74e18d05ebfb93a3ef5cf70f58fff.jpeg",
  activity: "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/317b8d4b17a44a6e3d27ac04976a7ddbc37c4c8e7cd3a1408ffb88dd834b9bb8.jpeg",
  winners: "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/a84777764d459c0a30fba2ed2f10a6b262153c3201cfe5c1f407a42b809ae78d.jpeg",
};

const FRAMES = [
  { img: IMG.hero, to: "/activities", badge: "新人专享", sub: "首充最高送 8888 金豆", face: true },
  { img: IMG.activity, to: "/activities", badge: "活动中心", sub: "充值送豪礼 · 天天有惊喜", face: false },
  { img: IMG.winners, to: "/rankings", badge: "中奖榜", sub: "恭喜众多玩家喜提大奖", face: false },
];

const QUICK = [
  { label: "公告中心", icon: Megaphone, to: "/activities", grad: "from-red-400 to-red-600" },
  { label: "活动列表", icon: Gift, to: "/activities", grad: "from-fuchsia-400 to-fuchsia-600" },
  { label: "立即充提", icon: Wallet, toast: "充提通道即将开放,敬请期待", grad: "from-rose-400 to-red-500" },
  { label: "每日任务", icon: CalendarCheck, toast: "每日任务功能开发中", grad: "from-sky-400 to-blue-600" },
  { label: "排行榜", icon: Trophy, to: "/rankings", grad: "from-amber-400 to-orange-500" },
];

const RAIL = [
  { k: "购彩大厅", hot: true }, { k: "棋牌游戏" }, { k: "群玩法" }, { k: "福彩体彩" }, { k: "胜利约战" },
];
const BANNERS = [IMG.canada, IMG.macau, IMG.taiwan, IMG.singapore, IMG.hero, IMG.activity, IMG.winners];

const useCountdown = () => {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now); end.setHours(24, 0, 0, 0);
      let s = Math.max(0, Math.floor((end - now) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      setLeft(`${h}:${m}:${ss}`);
    };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);
  return left;
};

const HeroCarousel = () => {
  const [idx, setIdx] = useState(0);
  const startX = useRef(0);
  const n = FRAMES.length;
  const go = (i) => setIdx((i + n) % n);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % n), 4000);
    return () => clearInterval(t);
  }, [idx, n]);
  return (
    <div className="px-2 pt-2">
      <div
        data-testid="hero-carousel"
        className="relative h-44 rounded-2xl overflow-hidden shadow-md ring-1 ring-red-100"
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - startX.current;
          if (dx < -40) go(idx + 1); else if (dx > 40) go(idx - 1);
        }}
      >
        <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {FRAMES.map((f, i) => (
            <Link key={i} to={f.to} data-testid={`hero-slide-${i}`} className="relative w-full h-full shrink-0">
              <img src={f.img} alt={f.badge} className={`w-full h-full object-cover ${f.face ? "object-top" : "object-center"}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
              <div className="absolute left-4 bottom-4">
                <span className="inline-block bg-red-600 text-white text-xs font-black rounded-full px-2.5 py-1 shadow">{f.badge}</span>
                <div className="mt-1.5 text-white font-black text-lg drop-shadow-md">{f.sub}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {FRAMES.map((_, i) => (
            <button key={i} data-testid={`hero-dot-${i}`} onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function MobileHome() {
  const { data: d } = useQuery({ queryKey: ["home"], queryFn: () => api.get("/home").then((r) => r.data) });
  const { data: gamesData } = useQuery({ queryKey: ["games"], queryFn: () => api.get("/games").then((r) => r.data) });
  const countdown = useCountdown();
  const navigate = useNavigate();
  const groups = gamesData?.groups || [];
  const [openId, setOpenId] = useState(null);
  const activeOpen = openId;

  const winners = (d?.rankings || []).slice(0, 6).map((r) => `恭喜 ${r.name} 在胜利28中奖 ${fmt(r.get)} 金豆`);
  const marquee = winners.length ? winners.join("　·　") : "恭喜众多玩家喜提大奖,好运连连!";

  const go = (item) => item.toast && toast.info(item.toast);

  return (
    <div data-testid="mobile-home" className="bg-gray-50 min-h-screen">
      {/* hero carousel */}
      <HeroCarousel />

      {/* quick icons */}
      <div className="grid grid-cols-5 gap-1 px-2 mt-4">
        {QUICK.map((q) => {
          const Icon = q.icon;
          const inner = (
            <div className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
              <span className={`w-12 h-12 rounded-full bg-gradient-to-b ${q.grad} shadow-md shadow-black/10 flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={2} />
              </span>
              <span className="text-xs font-bold text-gray-700">{q.label}</span>
            </div>
          );
          return q.to
            ? <Link key={q.label} to={q.to} data-testid={`quick-${q.label}`}>{inner}</Link>
            : <button key={q.label} data-testid={`quick-${q.label}`} onClick={() => go(q)}>{inner}</button>;
        })}
      </div>

      {/* marquee */}
      <div className="mx-2 mt-4 h-9 bg-red-50 rounded-full flex items-center gap-2 px-3 overflow-hidden">
        <Volume2 className="w-4 h-4 text-red-500 shrink-0" />
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-sm text-red-600 font-medium inline-block">
            <span className="pr-8">{marquee}</span><span className="pr-8">{marquee}</span>
          </div>
        </div>
      </div>

      {/* 购彩大厅: rail + expandable series with real 彩种 */}
      <div className="flex gap-2 px-2 mt-4">
        <div className="w-[72px] shrink-0 flex flex-col gap-2">
          {RAIL.map((r) => (
            r.hot ? (
              <div key={r.k} data-testid="rail-购彩大厅" className="flex flex-col items-center justify-center gap-1 h-16 rounded-xl bg-gradient-to-b from-red-500 to-red-600 text-white border border-red-500 shadow-md text-xs font-black">
                <Flame className="w-4 h-4" /><span>购彩大厅</span>
              </div>
            ) : (
              <button key={r.k} data-testid={`rail-${r.k}`} onClick={() => toast.info("敬请期待")}
                className="flex items-center justify-center h-16 rounded-xl bg-white text-gray-600 border border-gray-100 text-xs font-black active:scale-95 transition-all px-1 text-center leading-tight">
                {r.k}
              </button>
            )
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-3">
          {groups.map((grp, i) => {
            const open = activeOpen === grp.id;
            return (
              <div key={grp.id}>
                <button data-testid={`series-${grp.label}`} onClick={() => setOpenId(open ? null : grp.id)}
                  className="relative w-full h-24 rounded-xl overflow-hidden bg-[#FFF8E7] shadow-sm ring-1 ring-amber-100 active:scale-[0.99] transition-all">
                  <img src={BANNERS[i % BANNERS.length]} alt={grp.label} className="absolute inset-0 w-full h-full object-cover object-top" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/25 to-transparent" />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-left">
                    <div className="text-xl font-black text-red-700 drop-shadow-sm tracking-wide">{grp.label}系列</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/80 rounded-full px-2 py-0.5">
                      {open ? "收起" : `展开 ${grp.games.length} 款彩种`}<ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
                    </div>
                  </div>
                </button>
                {open && (
                  <div data-testid={`series-games-${grp.label}`} className="grid grid-cols-2 gap-2 mt-2">
                    {grp.games.map((g) => (
                      <button key={g.id} data-testid={`game-${g.id}`} onClick={() => navigate(`/games?game=${g.id}`)}
                        className="relative h-11 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 active:scale-95 active:border-red-400 active:text-red-600 hover:border-red-300 transition-all">
                        {g.name}
                        {g.is_hot && (
                          <span data-testid={`hot-${g.id}`} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black leading-none px-1.5 py-0.5 rounded-full shadow ring-2 ring-white">热</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* hot games */}
      <div className="px-2 mt-5">
        <div className="flex items-center gap-1.5 mb-2"><Flame className="w-4 h-4 text-red-600" /><h2 className="font-black text-gray-900">热门游戏</h2></div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
          {(d?.hotGames || []).map((g, i) => (
            <Link key={i} to="/games" data-testid={`mhome-hotgame-${i}`} className="relative w-40 shrink-0 h-24 rounded-xl overflow-hidden shadow-sm">
              <img src={g.cover} alt={g.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-2 left-2 text-white font-black drop-shadow">{g.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* gift exchange */}
      <div className="px-2 mt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5"><Gift className="w-4 h-4 text-amber-500" /><h2 className="font-black text-gray-900">礼品兑换</h2></div>
          <Link to="/shop" className="text-xs text-gray-400 flex items-center">全部<ChevronRight className="w-3 h-3" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {(d?.hotGoods || []).slice(0, 4).map((g) => (
            <div key={g.id} data-testid={`mhome-goods-${g.id}`} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
              <div className="h-24 bg-gray-50"><img src={g.img} alt={g.name} className="w-full h-full object-cover" /></div>
              <div className="p-2 flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-800 line-clamp-1">{g.name}</span>
                <span className="font-mono font-black text-red-600 text-sm flex items-center gap-1"><GoldBean className="w-4 h-4" />{fmt(g.points)}</span>
                <Link to="/shop" className="h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center active:scale-95 transition-all">我要兑换</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* floating red packet */}
      <Link to="/activities" data-testid="floating-packet" className="fixed right-3 bottom-24 z-40 flex flex-col items-center animate-bounce">
        <span className="w-14 h-16 rounded-xl bg-gradient-to-b from-red-500 to-red-700 shadow-lg shadow-red-500/40 flex items-center justify-center relative">
          <span className="absolute top-0 inset-x-0 h-5 rounded-t-xl bg-red-600" />
          <span className="w-6 h-6 rounded-full bg-amber-300 text-red-700 font-black text-sm flex items-center justify-center z-10 mt-1">福</span>
        </span>
        <span className="mt-0.5 px-1.5 py-0.5 rounded bg-black/70 text-amber-300 text-[10px] font-mono tabular-nums">{countdown}</span>
      </Link>
    </div>
  );
}
