import { ShieldCheck } from "lucide-react";

export const Footer = () => (
  <footer data-testid="site-footer" className="mt-8 border-t border-gray-200 bg-gray-900 text-gray-400">
    <div className="mx-auto max-w-[1400px] px-4 py-6 flex flex-col items-center gap-2 text-center">
      <div className="flex items-center gap-2 text-gray-300">
        <ShieldCheck className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium">
          www.shengli28.com 胜利<span className="text-red-500 font-bold">28</span> 版权所有
        </span>
      </div>
      <p className="text-xs text-gray-500 font-mono tracking-wide">
        Copyright (C) 2016 · All Rights Reserved · 黔ICP备16005137号-1
      </p>
    </div>
  </footer>
);
