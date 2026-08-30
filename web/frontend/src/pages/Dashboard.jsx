import { useState } from "react";
import { toast } from "sonner";
import { AccountBar } from "@/components/AccountBar";
import { GameNav } from "@/components/GameNav";
import { DrawInfoBar } from "@/components/DrawInfoBar";
import { GameToolbar } from "@/components/GameToolbar";
import { HistoryTable } from "@/components/HistoryTable";
import { HistoryCardList } from "@/components/HistoryCard";
import { Pagination } from "@/components/Pagination";
import { Footer } from "@/components/Footer";
import {
  account,
  gameGroups,
  activeGame,
  draws,
  currentDraw,
  drawingPeriod,
} from "@/data/mockData";

export default function Dashboard() {
  const [activeGameId, setActiveGameId] = useState(activeGame.gameId);
  const [page, setPage] = useState(1);
  const totalPages = 153;
  const totalRecords = 3042;

  const onPageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(`第 ${p} 页`, { description: "分页数据由后端返回" });
  };

  const activeName =
    gameGroups
      .flatMap((g) => g.games)
      .find((g) => g.id === activeGameId)?.name || activeGame.name;

  const onSelect = (id) => {
    setActiveGameId(id);
    const name = gameGroups.flatMap((g) => g.games).find((g) => g.id === id)?.name;
    toast.info(`已切换至 ${name}`, { description: "开奖数据将由后端推送刷新" });
  };

  const onBet = (draw) => {
    toast.success("马上投注", { description: `期号 ${draw.period} · ${activeName}` });
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <AccountBar account={account} />
        <GameNav groups={gameGroups} activeGameId={activeGameId} onSelect={onSelect} />
      </div>

      <main className="pt-3 sm:pt-4">
        <GameToolbar gameName={activeName} />
        <div className="mt-3 sm:mt-4">
          <DrawInfoBar draw={currentDraw} gameName={activeName} nextPeriod={drawingPeriod} />
        </div>

        <div className="mx-auto max-w-[1400px] px-4 mt-4 hidden md:flex items-center justify-between">
          <h2 className="text-sm font-black tracking-tight text-gray-900">
            开奖记录
            <span className="ml-2 text-xs font-normal text-gray-400">{activeName}</span>
          </h2>
          <span className="text-xs text-gray-400 font-mono">共 {draws.length} 期</span>
        </div>

        <div className="md:hidden px-3 mt-1 flex items-center justify-between">
          <h2 className="text-sm font-black tracking-tight text-gray-900">开奖记录</h2>
          <span className="text-xs text-gray-400 font-mono">共 {draws.length} 期</span>
        </div>

        <HistoryTable draws={draws} onBet={onBet} />
        <HistoryCardList draws={draws} onBet={onBet} />

        <div className="mx-auto max-w-[1400px] px-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            onChange={onPageChange}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
