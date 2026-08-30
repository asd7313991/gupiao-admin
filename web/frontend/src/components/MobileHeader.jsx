import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ChevronRight, Moon, Sun, LogOut, Headphones } from "lucide-react";
import { GoldBean } from "@/components/GoldBean";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/useTheme";
import { mainMenu } from "@/data/mockData";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");

export const MobileHeader = ({ account }) => {
  const { pathname } = useLocation();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <>
      <header data-testid="mobile-header" className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-[#D81E2C] text-white shadow-md">
        <div className="relative flex items-center justify-between h-full px-3">
          <button data-testid="mobile-menu-btn" onClick={() => setOpen(true)}
            className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full active:scale-90 active:bg-white/15 transition-all">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 font-black text-xl tracking-wide drop-shadow-sm">胜利<span className="text-amber-300">28</span></Link>
          <Link to="/user" data-testid="mobile-balance" className="flex items-center gap-1 h-8 px-2.5 rounded-full bg-white/15 backdrop-blur text-amber-200 text-xs font-bold font-mono tabular-nums active:scale-95 transition-all">
            <GoldBean className="w-4 h-4" />{fmt(account?.beans)}
          </Link>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" data-testid="mobile-drawer" className="w-[280px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 bg-[#D81E2C] text-left">
            <SheetTitle className="text-white font-black text-xl">胜利<span className="text-amber-300">28</span></SheetTitle>
            <SheetDescription className="text-white/80 text-xs pt-1">
              {account?.username} · 金豆 {fmt(account?.beans)}
            </SheetDescription>
          </SheetHeader>
          <nav className="p-2">
            {mainMenu.map((item) => (
              <Link key={item.id} to={item.to} data-testid={`mdrawer-${item.id}`} onClick={() => setOpen(false)}
                className={cn("flex items-center justify-between h-11 px-3 rounded-lg text-sm font-bold transition-all",
                  isActive(item.to) ? "bg-amber-500 text-white" : "text-gray-700 active:bg-red-50")}>
                {item.label}
                <ChevronRight className={cn("w-4 h-4", isActive(item.to) ? "text-white" : "text-gray-300")} />
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-100 grid grid-cols-3 gap-1.5">
            <button onClick={toggle} className="flex flex-col items-center gap-1 h-14 rounded-lg border border-gray-200 text-xs text-gray-600 justify-center active:scale-95 transition-all">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{dark ? "浅色" : "深色"}
            </button>
            <button className="flex flex-col items-center gap-1 h-14 rounded-lg border border-gray-200 text-xs text-gray-600 justify-center active:scale-95 transition-all">
              <Headphones className="w-4 h-4" />客服
            </button>
            <button className="flex flex-col items-center gap-1 h-14 rounded-lg border border-red-200 text-xs text-red-500 justify-center active:scale-95 transition-all">
              <LogOut className="w-4 h-4" />退出
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
