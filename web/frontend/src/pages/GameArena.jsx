import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { GameNav } from "@/components/GameNav";
import { DrawInfoBar } from "@/components/DrawInfoBar";
import { GameToolbar } from "@/components/GameToolbar";
import { HistoryTable } from "@/components/HistoryTable";
import { HistoryCardList } from "@/components/HistoryCard";
import { Pagination } from "@/components/Pagination";
import MobileGameArena from "@/pages/MobileGameArena";
import BetPanel from "@/pages/BetPanel";
import { BetModeEditor } from "@/components/BetModeEditor";
import { AutoBetPanel } from "@/components/AutoBetPanel";
import { TrendChart } from "@/components/TrendChart";
import { api } from "@/lib/api";

const SIZE = 20;

function toDraw(d, status) {
  const drawn = status === "drawn";
  const t = new Date(d.kjtime * 1000);
  return {
    period: d.period,
    drawTime: t.toTimeString().slice(0, 8),
    numbers: drawn ? d.numbers : null,
    sum: drawn ? d.sum : null,
    bigSmall: drawn ? (d.sum >= 14 ? "大" : "小") : null,
    oddEven: drawn ? (d.sum % 2 === 0 ? "双" : "单") : null,
    status,
    totalBeans: drawn ? 1200000 + (d.period % 97) * 8300 : 0,
    winnerCount: drawn ? 40 + (d.period % 53) : 0,
    winAmount: drawn ? 320000 + (d.period % 41) * 4100 : 0,
    betAmount: drawn ? 880000 + (d.period % 71) * 5200 : 0,
  };
}

export default function GameArena() {
  const [searchParams] = useSearchParams();
  const [activeGameId, setActiveGameId] = useState(searchParams.get("game") || "1");
  const [page, setPage] = useState(1);
  const [deskBet, setDeskBet] = useState(null);
  const [deskMode, setDeskMode] = useState(false);
  const [deskAuto, setDeskAuto] = useState(false);
  const [deskTrend, setDeskTrend] = useState(false);

  // 首页系列卡/分类点击 → 直达对应彩种
  useEffect(() => {
    const g = searchParams.get("game");
    if (g) { setActiveGameId(g); setPage(1); }
  }, [searchParams]);

  const { data: gamesData } = useQuery({ queryKey: ["games"], queryFn: () => api.get("/games").then((r) => r.data) });
  const groups = gamesData?.groups || [];

  const { data: user } = useQuery({ queryKey: ["user"], queryFn: () => api.get("/user").then((r) => r.data) });
  const beans = user?.points ?? 0;

  const { data, isLoading } = useQuery({
    queryKey: ["draws", activeGameId, page],
    queryFn: () => api.get("/draws", { params: { gid: activeGameId, page, size: SIZE } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
  const drawsData = data || { total: 0, draws: [] };

  const activeName = useMemo(
    () => groups.flatMap((g) => g.games).find((g) => g.id === activeGameId)?.name || "急速28",
    [groups, activeGameId]
  );

  const latestPeriod = drawsData.draws[0]?.period;
  const nextPeriod = latestPeriod ? latestPeriod + 1 : undefined;

  const rows = useMemo(() => {
    const drawn = drawsData.draws.map((d) => toDraw(d, "drawn"));
    if (page !== 1 || !latestPeriod) return drawn;
    const upcoming = [];
    for (let i = 5; i >= 2; i--) upcoming.push(toDraw({ period: latestPeriod + i, kjtime: Math.floor(Date.now() / 1000) + i * 210 }, "bet"));
    upcoming.push(toDraw({ period: latestPeriod + 1, kjtime: Math.floor(Date.now() / 1000) + 210 }, "drawing"));
    return [...upcoming, ...drawn];
  }, [drawsData.draws, page, latestPeriod]);

  // real trend data (only meaningful for 0-27 sum games)
  const trendDraws = useMemo(
    () => drawsData.draws.map((d) => ({
      period: d.period,
      time: new Date(d.kjtime * 1000).toTimeString().slice(0, 5),
      numbers: d.numbers,
      sum: d.sum,
    })),
    [drawsData.draws]
  );

  const heroDraw = useMemo(() => drawsData.draws[0] ? toDraw(drawsData.draws[0], "drawn") : null, [drawsData.draws]);
  const totalPages = Math.max(1, Math.ceil(drawsData.total / SIZE));

  const onSelect = (id) => {
    if (id === activeGameId) return;
    setActiveGameId(id);
    setPage(1);
    const name = groups.flatMap((g) => g.games).find((g) => g.id === id)?.name;
    toast.info(`已切换至 ${name || ""}`, { description: "开奖数据来自服务端" });
  };
  const onBet = (draw) => setDeskBet(draw);
  const onPageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Mobile: dense betting terminal */}
      <MobileGameArena
        groups={groups}
        activeGameId={activeGameId}
        activeName={activeName}
        onSelect={onSelect}
        rows={rows}
        heroDraw={heroDraw}
        nextPeriod={nextPeriod}
        trendDraws={trendDraws}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onBet={onBet}
      />

      {/* Desktop */}
      <div className="hidden md:block">
      <div className="bg-white shadow-sm">
        <GameNav groups={groups} activeGameId={activeGameId} onSelect={onSelect} />
      </div>

      <div className="pt-3 sm:pt-4">
        <GameToolbar gameName={activeName} trendDraws={trendDraws} />

        <div className="mt-3 sm:mt-4">
          {heroDraw ? (
            <DrawInfoBar draw={heroDraw} gameName={activeName} nextPeriod={nextPeriod} />
          ) : (
            <div className="mx-auto max-w-[1400px] px-3 sm:px-4">
              <div className="rounded-md border border-gray-200 bg-white shadow-sm p-8 text-center text-gray-400">
                {isLoading ? "加载开奖数据中…" : `${activeName} 暂无开奖数据,等待服务端推送`}
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-[1400px] px-4 mt-4 hidden md:flex items-center justify-between">
          <h2 className="text-sm font-black tracking-tight text-gray-900">
            开奖记录<span className="ml-2 text-xs font-normal text-gray-400">{activeName}</span>
          </h2>
          <span className="text-xs text-gray-400 font-mono">共 {drawsData.total} 期</span>
        </div>
        <div className="md:hidden px-3 mt-1 flex items-center justify-between">
          <h2 className="text-sm font-black tracking-tight text-gray-900">开奖记录</h2>
          <span className="text-xs text-gray-400 font-mono">共 {drawsData.total} 期</span>
        </div>

        <HistoryTable draws={rows} onBet={onBet} />
        <HistoryCardList draws={rows} onBet={onBet} />

        <div className="mx-auto max-w-[1400px] px-4">
          <Pagination page={page} totalPages={totalPages} totalRecords={drawsData.total} onChange={onPageChange} />
        </div>
      </div>
      </div>

      {/* Desktop / landscape betting panel */}
      <BetPanel
        open={!!deskBet}
        variant="desktop"
        onClose={() => setDeskBet(null)}
        activeName={activeName}
        beans={beans}
        gid={activeGameId}
        tabHandlers={{
          records: () => toast.info("投注记录", { description: "请在工具栏「投注记录」查看示例明细" }),
          mode: () => setDeskMode(true),
          auto: () => setDeskAuto(true),
          trend: () => setDeskTrend(true),
        }}
      />
      <BetModeEditor open={deskMode} onOpenChange={setDeskMode} gameName={activeName} />
      <AutoBetPanel open={deskAuto} onOpenChange={setDeskAuto} gameName={activeName} />
      <TrendChart open={deskTrend} onOpenChange={setDeskTrend} gameName={activeName} draws={trendDraws} />
    </>
  );
}

