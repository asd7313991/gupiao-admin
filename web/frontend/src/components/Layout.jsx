import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { AccountBar } from "@/components/AccountBar";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { api } from "@/lib/api";
import { account as fallbackAccount } from "@/data/mockData";
import { cn } from "@/lib/utils";

const TITLES = {
  "/": "网站首页", "/activities": "活动专区", "/rankings": "牛人榜", "/games": "游戏乐园",
  "/shop": "兑换奖品", "/intro": "得胜介绍", "/partners": "合作商家", "/user": "用户中心",
};

export default function Layout() {
  const [account, setAccount] = useState(fallbackAccount);
  const { pathname } = useLocation();

  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => api.get("/config").then((r) => r.data) });
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: () => api.get("/user").then((r) => r.data) });

  useEffect(() => { toast.dismiss(); }, [pathname]);

  useEffect(() => {
    const brand = config?.title || "胜利28";
    document.title = `${TITLES[pathname] || ""} · ${brand}`.replace(/^ · /, "");
  }, [pathname, config]);

  useEffect(() => {
    if (user) setAccount({
      username: user.name, userId: user.id, beans: user.points, bank: user.money,
      unread: (user.messages || []).filter((m) => !m.read).length,
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col">
      {/* desktop header (unchanged) */}
      <div className="hidden md:block sticky top-0 z-50 bg-white shadow-sm">
        <AccountBar account={account} />
      </div>
      {/* mobile red header shell (all mobile pages, synced) */}
      <MobileHeader account={account} />

      <main className="flex-1 pt-14 pb-16 md:pt-0 md:pb-0">
        <Outlet />
      </main>

      <div className="hidden md:block"><Footer /></div>
      <BackToTop />
      {/* mobile bottom tab bar (all mobile pages, synced) */}
      <MobileTabBar />
    </div>
  );
}
