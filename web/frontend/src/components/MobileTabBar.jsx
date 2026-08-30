import { Link, useLocation } from "react-router-dom";
import { Home, Sparkles, Gift, User, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "首页", icon: Home },
  { to: "/activities", label: "活动", icon: Sparkles },
  { to: "/games", label: "游戏乐园", icon: Gamepad2, center: true },
  { to: "/shop", label: "兑换", icon: Gift },
  { to: "/user", label: "会员中心", icon: User },
];

export const MobileTabBar = () => {
  const { pathname } = useLocation();
  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <nav data-testid="mobile-tabbar" className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-5 h-full">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(t.to);
          if (t.center) {
            return (
              <Link key={t.to} to={t.to} data-testid="tab-games" className="relative flex flex-col items-center justify-end pb-1.5">
                <span className="absolute -top-5 w-14 h-14 rounded-full bg-gradient-to-b from-[#F5A623] to-[#D81E2C] shadow-lg shadow-red-400/40 flex items-center justify-center ring-4 ring-white active:scale-95 transition-all">
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
                </span>
                <span className={cn("text-[11px] font-bold mt-8", active ? "text-red-600" : "text-gray-500")}>{t.label}</span>
              </Link>
            );
          }
          return (
            <Link key={t.to} to={t.to} data-testid={`tab-${t.to === "/" ? "home" : t.to.slice(1)}`}
              className="flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all">
              <Icon className={cn("w-5 h-5", active ? "text-red-600" : "text-gray-400")} strokeWidth={active ? 2.4 : 2} />
              <span className={cn("text-[11px] font-bold", active ? "text-red-600" : "text-gray-500")}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
