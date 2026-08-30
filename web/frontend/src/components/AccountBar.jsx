import { useState } from "react";
import { GoldBean } from "@/components/GoldBean";
import {
  Landmark,
  User,
  RefreshCw,
  LogOut,
  Activity,
  Gift,
  Store,
  Smartphone,
  FlagTriangleRight,
  Moon,
  Sun,
  Menu,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/useTheme";
import { utilityLinks, mainMenu } from "@/data/mockData";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const iconMap = { Activity, Gift, Store, Smartphone };
const fmt = (n) => Number(n || 0).toLocaleString("en-US");

export const AccountBar = ({ account }) => {
  const { pathname } = useLocation();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <header data-testid="site-header">
      {/* ============ DESKTOP ============ */}
      <div className="hidden md:block">
        {/* Row 1: dark utility bar */}
        <div data-testid="utility-bar" className="w-full bg-gray-900 text-gray-300">
          <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-3 px-4 h-9 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 shrink-0">
              {utilityLinks.map((link) => {
                const Icon = iconMap[link.icon];
                return (
                  <button key={link.id} type="button" data-testid={`utility-${link.id}`}
                    className="flex items-center gap-1.5 px-2.5 h-9 text-xs font-medium text-gray-300 hover:text-amber-400 transition-colors whitespace-nowrap">
                    <Icon className="w-3.5 h-3.5 text-amber-500" />
                    {link.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs">
              <span className="flex items-center gap-1.5 text-gray-200">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold text-amber-400">{account.username}</span>
                <span className="text-gray-500">(ID:{account.userId})</span>
              </span>
              <span data-testid="account-beans" className="flex items-center gap-1 font-mono tabular-nums">
                <GoldBean className="w-3.5 h-3.5 text-amber-500" />金豆:<span className="font-bold text-white">{fmt(account.beans)}</span>
              </span>
              <span data-testid="account-bank" className="flex items-center gap-1 font-mono tabular-nums">
                <Landmark className="w-3.5 h-3.5 text-gray-400" />银行:<span className="font-bold text-white">{fmt(account.bank)}</span>
              </span>
              <button data-testid="account-center" type="button" className="flex items-center gap-1 hover:text-amber-400 transition-colors whitespace-nowrap">
                <User className="w-3.5 h-3.5" />用户中心
              </button>
              <button data-testid="account-refresh" type="button" className="flex items-center gap-1 hover:text-amber-400 transition-colors whitespace-nowrap">
                <RefreshCw className="w-3.5 h-3.5" />刷新
              </button>
              <button data-testid="theme-toggle" type="button" onClick={toggle} className="flex items-center gap-1 hover:text-amber-400 transition-colors whitespace-nowrap">
                {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}{dark ? "浅色" : "深色"}
              </button>
              <button data-testid="account-logout" type="button" className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors whitespace-nowrap">
                <LogOut className="w-3.5 h-3.5" />退出
              </button>
            </div>
          </div>
        </div>
        {/* Row 2: logo + main menu */}
        <div data-testid="brand-bar" className="w-full bg-white border-b border-gray-200">
          <div className="mx-auto max-w-[1400px] flex items-center gap-4 px-4 h-16">
            <Link to="/" data-testid="site-logo" className="flex items-center gap-2 shrink-0 group">
              <span className="relative flex items-center justify-center w-9 h-9 rounded-md bg-gradient-to-br from-red-600 to-red-700 shadow-sm">
                <FlagTriangleRight className="w-5 h-5 text-amber-300" strokeWidth={2.5} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display font-extrabold text-xl tracking-tight text-gray-900">胜利<span className="text-red-600">28</span></span>
                <span className="text-[10px] font-mono text-gray-400 tracking-wide">www.shengli28.com</span>
              </span>
            </Link>
            <nav data-testid="main-menu" className="flex items-center gap-1 overflow-x-auto no-scrollbar ml-2">
              {mainMenu.map((item) => (
                <Link key={item.id} to={item.to} data-testid={`menu-${item.id}`}
                  className={cn("shrink-0 h-9 px-3 rounded-sm text-sm font-semibold whitespace-nowrap transition-all active:scale-95 flex items-center",
                    isActive(item.to) ? "bg-amber-500 text-white shadow-sm" : "text-gray-600 hover:text-red-600 hover:bg-red-50")}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ============ MOBILE ============ */}
      <div className="md:hidden w-full bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-3 h-14">
          <Link to="/" data-testid="site-logo-mobile" className="flex items-center gap-2">
            <span className="relative flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-red-600 to-red-700 shadow-sm">
              <FlagTriangleRight className="w-4 h-4 text-amber-300" strokeWidth={2.5} />
            </span>
            <span className="font-display font-extrabold text-lg tracking-tight text-gray-900">胜利<span className="text-red-600">28</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 h-8 rounded-sm bg-amber-50 text-amber-700 text-xs font-bold font-mono tabular-nums">
              <GoldBean className="w-3.5 h-3.5" />{fmt(account.beans)}
            </span>
            <button data-testid="mobile-menu-btn" type="button" onClick={() => setOpen(true)}
              className="w-9 h-9 rounded-sm border border-gray-200 flex items-center justify-center text-gray-700 active:scale-95 transition-all">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" data-testid="nav-drawer" className="w-[300px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 bg-gray-900 text-left">
            <SheetTitle className="text-white flex items-center gap-2">
              <span className="relative flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-red-600 to-red-700">
                <FlagTriangleRight className="w-4 h-4 text-amber-300" strokeWidth={2.5} />
              </span>
              胜利<span className="text-red-500">28</span>
            </SheetTitle>
            <div className="flex items-center gap-2 text-xs text-gray-300 pt-1">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-amber-400">{account.username}</span>
              <span className="text-gray-500">(ID:{account.userId})</span>
            </div>
            <SheetDescription className="sr-only">主导航菜单</SheetDescription>
          </SheetHeader>

          {/* account summary */}
          <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-100">
            <div className="rounded-sm bg-amber-50 px-3 py-2">
              <div className="text-[11px] text-gray-400 flex items-center gap-1"><GoldBean className="w-3 h-3 text-amber-500" />金豆</div>
              <div className="font-mono font-black text-amber-600 tabular-nums">{fmt(account.beans)}</div>
            </div>
            <div className="rounded-sm bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-400 flex items-center gap-1"><Landmark className="w-3 h-3" />银行</div>
              <div className="font-mono font-black text-gray-800 tabular-nums">{fmt(account.bank)}</div>
            </div>
          </div>

          {/* main menu */}
          <nav data-testid="drawer-menu" className="p-2">
            {mainMenu.map((item) => (
              <Link key={item.id} to={item.to} data-testid={`drawer-menu-${item.id}`} onClick={() => setOpen(false)}
                className={cn("flex items-center justify-between h-11 px-3 rounded-sm text-sm font-semibold transition-all",
                  isActive(item.to) ? "bg-amber-500 text-white" : "text-gray-700 hover:bg-red-50 hover:text-red-600")}>
                {item.label}
                <ChevronRight className={cn("w-4 h-4", isActive(item.to) ? "text-white" : "text-gray-300")} />
              </Link>
            ))}
          </nav>

          {/* utility links */}
          <div className="px-3 py-2 border-t border-gray-100">
            <div className="text-[11px] text-gray-400 mb-1.5">快捷入口</div>
            <div className="grid grid-cols-2 gap-1.5">
              {utilityLinks.map((link) => {
                const Icon = iconMap[link.icon];
                return (
                  <button key={link.id} type="button" data-testid={`drawer-utility-${link.id}`}
                    className="flex items-center gap-1.5 h-9 px-2.5 rounded-sm border border-gray-200 text-xs font-semibold text-gray-600 hover:border-red-300 hover:text-red-600 transition-all">
                    <Icon className="w-3.5 h-3.5 text-amber-500" />{link.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* actions */}
          <div className="p-3 border-t border-gray-100 grid grid-cols-3 gap-1.5">
            <button data-testid="drawer-refresh" type="button" className="flex flex-col items-center gap-1 h-14 rounded-sm border border-gray-200 text-xs text-gray-600 hover:border-red-300 hover:text-red-600 transition-all justify-center">
              <RefreshCw className="w-4 h-4" />刷新
            </button>
            <button data-testid="drawer-theme" type="button" onClick={toggle} className="flex flex-col items-center gap-1 h-14 rounded-sm border border-gray-200 text-xs text-gray-600 hover:border-amber-300 hover:text-amber-600 transition-all justify-center">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{dark ? "浅色" : "深色"}
            </button>
            <button data-testid="drawer-logout" type="button" className="flex flex-col items-center gap-1 h-14 rounded-sm border border-red-200 text-xs text-red-500 hover:bg-red-50 transition-all justify-center">
              <LogOut className="w-4 h-4" />退出
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};
