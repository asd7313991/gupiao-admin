import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, fmt } from "@/lib/api";
import { BannerCarousel } from "@/components/BannerCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Gift, Trophy, Megaphone, ChevronRight, Gamepad2, User, Flame,
} from "lucide-react";
import { GoldBean } from "@/components/GoldBean";
import MobileHome from "@/pages/MobileHome";

const SERIES_POSTER = {
  "急速": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/32451bc225c4a7dc6260a3b550a5414ba573041c3b9c5b87acc008d8b7784e2e.jpeg",
  "北京": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/8232937aadce72b68f105a779f0d184ec7f9b9c87dd8b1fe792cbc243bb2e2bc.jpeg",
  "蛋蛋": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/d0a5c83a9fdcd778c4cc54deb886438e36c2d884df205775125a84f2c2a10588.jpeg",
  "PK": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/6bd49ee3c890da4dba6f4ee623826974a968e0548c3b43494c8ba9cd1d959e1b.jpeg",
  "加拿大": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/b52bb1da8f2363b52d0d109e9f2c9462961e7deba3a2c7711b076dbf927027e4.jpeg",
  "韩国": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/1d7aa9c53517dee91aac9a50b4bca0e70f1e7a085714af8ce33e09600f17f5a5.jpeg",
};
const FALLBACK_POSTER = SERIES_POSTER["急速"];

const Title = ({ icon: Icon, cn: c, children }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${c}`}><Icon className="w-4 h-4 text-white" /></span>
    <h2 className="text-lg font-black tracking-tight text-gray-900">{children}</h2>
  </div>
);

export default function Home() {
  const { data: d, isLoading } = useQuery({ queryKey: ["home"], queryFn: () => api.get("/home").then((r) => r.data) });

  return (
    <>
      <div className="block md:hidden"><MobileHome /></div>
      <div className="hidden md:block mx-auto max-w-[1400px] px-3 sm:px-4 py-4 sm:py-6 space-y-8">
      {/* carousel + user box */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <BannerCarousel banners={d?.banners || []} />
        <div data-testid="home-userbox" className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
            <span className="font-black text-gray-900 flex items-center gap-1.5"><User className="w-4 h-4 text-red-600" /> 用户信息</span>
            <Link to="/user" className="text-xs text-gray-400 hover:text-red-600">用户中心 ›</Link>
          </div>
          <ul className="space-y-2 text-sm">
            {[["I D", "33"], ["帐号", "asd7313991"], ["昵称", "jessie"]].map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="text-gray-400">{k}</span><span className="font-mono font-semibold text-gray-800">{v}</span></li>
            ))}
            <li className="flex justify-between items-center pt-1"><span className="text-gray-400">金豆</span><span className="font-mono font-black text-amber-600 flex items-center gap-1"><GoldBean className="w-4 h-4" />100,000</span></li>
            <li className="flex justify-between"><span className="text-gray-400">银行</span><span className="font-mono font-black text-gray-800">0</span></li>
          </ul>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Link to="/shop" className="h-9 rounded-sm bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center justify-center transition-all active:scale-95">兑换奖品</Link>
            <Link to="/games" className="h-9 rounded-sm bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center transition-all active:scale-95">马上游戏</Link>
          </div>
        </div>
      </section>

      {/* hot games with real cover art */}
      <section>
        <Title icon={Gamepad2} cn="bg-red-600">热门游戏 Games</Title>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)
            : (d?.hotGames || []).map((g, i) => (
              <Link key={i} to="/games" data-testid={`home-hotgame-${i}`} className="group relative rounded-lg overflow-hidden border border-gray-200 shadow-sm h-40 hover:-translate-y-1 hover:shadow-md transition-all">
                <img src={g.cover} alt={g.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                  <span className="text-white font-black text-lg drop-shadow">{g.name}</span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-sm bg-amber-400 text-red-900 text-xs font-black">{g.tag}<ChevronRight className="w-3 h-3" /></span>
                </div>
              </Link>
            ))}
        </div>
        {/* 彩种系列入口(仿手机端) with 美女海报 */}
        <div className="flex items-center gap-2 mt-6 mb-3">
          <Flame className="w-4 h-4 text-red-600" />
          <h3 className="text-base font-black tracking-tight text-gray-900">购彩大厅 · 彩种系列</h3>
          <Link to="/games" className="ml-auto text-xs font-bold text-gray-400 hover:text-red-600 flex items-center gap-0.5">全部彩种<ChevronRight className="w-3 h-3" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(d?.gameGroups || []).map((grp) => {
            const flagship = grp.games.find((g) => g.is_hot) || grp.games[0];
            const hasHot = grp.games.some((g) => g.is_hot);
            const poster = SERIES_POSTER[grp.label] || FALLBACK_POSTER;
            return (
              <Link
                key={grp.id}
                to={`/games?game=${flagship?.id ?? ""}`}
                data-testid={`home-series-${grp.id}`}
                className="group relative rounded-xl overflow-hidden border border-gray-200 shadow-sm h-40 hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <img src={poster} alt={`${grp.label}系列`} className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white drop-shadow tracking-wide">{grp.label}系列</span>
                    {hasHot && <span data-testid={`home-series-hot-${grp.id}`} className="bg-red-600 text-white text-[10px] font-black leading-none px-1.5 py-0.5 rounded-full shadow ring-2 ring-white/30">热</span>}
                  </div>
                  <div className="mt-1 text-xs font-bold text-amber-300">{grp.games.length} 款彩种 · 极速开奖</div>
                  <span className="mt-3 inline-flex w-max items-center gap-1 px-3 py-1.5 rounded-full bg-red-600 group-hover:bg-red-500 text-white text-xs font-black transition-colors">
                    进入盯盘<ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* gift exchange with product photos */}
      <section>
        <Title icon={Gift} cn="bg-amber-500">礼品兑换 Present</Title>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(d?.hotGoods || []).map((g) => (
            <div key={g.id} data-testid={`home-goods-${g.id}`} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="h-28 bg-gray-50 overflow-hidden"><img src={g.img} alt={g.name} className="w-full h-full object-cover" /></div>
              <div className="p-3 flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-gray-800 text-center line-clamp-1">{g.name}</span>
                <span className="font-mono font-black text-red-600 flex items-center justify-center gap-1"><GoldBean className="w-4 h-4 text-amber-500" />{fmt(g.points)}</span>
                <Link to="/shop" className="w-full h-8 rounded-sm bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center transition-all active:scale-95">我要兑换</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* activities + news + player rankings */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <Title icon={Megaphone} cn="bg-red-600">最新活动 Popular Events</Title>
          <div className="space-y-3">
            {(d?.activities || []).map((a) => (
              <Link key={a.id} to="/activities" data-testid={`home-act-${a.id}`} className="flex gap-3 rounded-md border border-gray-200 bg-white shadow-sm p-3 hover:shadow-md transition-all">
                <span className="w-20 h-16 shrink-0 rounded-sm bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white font-black text-xs text-center px-1">{a.title.slice(0, 4)}</span>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">{a.title}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">活动时间:{a.mintime} ~ {a.maxtime}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Title icon={Megaphone} cn="bg-amber-500">新闻公告 News</Title>
            <ul className="rounded-md border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
              {(d?.news || []).map((n) => (
                <li key={n.id} className="px-3 py-2.5 text-sm hover:bg-red-50/40">
                  <span className="text-red-600 font-bold mr-1">[公告]</span>
                  <span className="text-gray-700">{n.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Title icon={Trophy} cn="bg-red-600">玩家排名 Player Rankings</Title>
            <ul className="rounded-md border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
              {(d?.rankings || []).slice(0, 8).map((r, i) => (
                <li key={i} data-testid={`home-rank-${i}`} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${i < 3 ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"}`}>{r.rank}</span>
                  <span className="flex-1 truncate text-gray-700">{r.name}</span>
                  <span className="font-mono font-bold text-amber-600 flex items-center gap-1">{fmt(r.get)}<GoldBean className="w-3.5 h-3.5" /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
