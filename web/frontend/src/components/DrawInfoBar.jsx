import { ResultBadge } from "@/components/ResultBadge";
import { CountdownRing } from "@/components/CountdownRing";
import { cn } from "@/lib/utils";
import { Clock, Hash, ExternalLink } from "lucide-react";

const Stat = ({ label, value, tone }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-wider text-gray-400">{label}</span>
    <span className={cn("text-sm font-bold font-mono tabular-nums", tone || "text-gray-900")}>
      {value}
    </span>
  </div>
);

export const DrawInfoBar = ({ draw, gameName, nextPeriod }) => {
  const many = (draw.numbers?.length || 0) > 6;
  return (
    <section
      data-testid="draw-info-bar"
      className="mx-auto max-w-[1400px] px-3 sm:px-4"
    >
      <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* header strip */}
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-black text-gray-900">{gameName}</span>
            <span className="hidden sm:inline text-xs text-gray-400">最新开奖</span>
          </div>
          <span
            data-testid="next-period-tag"
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-sm bg-amber-100 text-amber-700 border border-amber-400 text-xs font-bold animate-breathe"
          >
            第 <span className="font-mono tabular-nums">{nextPeriod}</span> 期 开奖中
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-3 sm:p-4">
          {/* left: period + time */}
          <div className="flex items-center gap-4 lg:w-56 shrink-0">
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-gray-400">
                <Hash className="w-3 h-3" /> 期号
              </span>
              <span className="text-lg font-black font-mono text-gray-900 tabular-nums">
                {draw.period}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-gray-400">
                <Clock className="w-3 h-3" /> 时间
              </span>
              <span className="text-sm font-bold font-mono text-gray-700 tabular-nums">
                {draw.drawTime}
              </span>
            </div>
          </div>

          {/* center: countdown ring + result numbers (visual focus) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 flex-1 py-1">
            <CountdownRing periodSeconds={210} initialRemaining={66} />
            <div className="flex items-center justify-center gap-3">
            <div className={cn("flex flex-wrap items-center gap-1.5 justify-center", many && "max-w-[380px]")}>
              {draw.numbers.map((n, i) => (
                <ResultBadge key={i} value={n} size={many ? "sm" : "lg"} tone="red" />
              ))}
            </div>
            <span className="text-2xl font-light text-gray-300">=</span>
            <div className="flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-wider text-gray-400">{many ? "结果" : "和值"}</span>
              <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums leading-none text-red-600">
                {draw.sum}
              </span>
            </div>
            <div className="flex flex-col gap-1 pl-1">
              <span className="px-2 py-0.5 rounded-sm bg-red-50 text-red-600 text-xs font-bold text-center">
                {draw.bigSmall}
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-amber-50 text-amber-700 text-xs font-bold text-center">
                {draw.oddEven}
              </span>
            </div>
            </div>
          </div>

          {/* right: quick stats + verify link */}
          <div className="flex items-center gap-5 lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-5">
            <Stat label="金豆总数" value={draw.totalBeans.toLocaleString("en-US")} tone="text-amber-600" />
            <Stat label="中奖人数" value={draw.winnerCount} />
            <a
              href="#verify"
              data-testid="verify-link"
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> 官方验证
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
