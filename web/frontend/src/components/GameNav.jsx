import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const GameTab = ({ game, active, onSelect }) => (
  <button
    type="button"
    data-testid={`game-tab-${game.id}`}
    onClick={() => onSelect(game.id)}
    className={cn(
      "relative shrink-0 h-8 px-3 rounded-sm text-xs font-semibold whitespace-nowrap border transition-all active:scale-95",
      active
        ? "bg-red-600 text-white border-red-600 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
    )}
  >
    {game.name}
    {game.is_hot && !active && (
      <span
        data-testid={`game-hot-${game.id}`}
        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black leading-none px-1 py-0.5 rounded-full shadow ring-2 ring-white"
      >
        热
      </span>
    )}
  </button>
);

// Desktop: horizontal grouped scrollable nav. Mobile: collapsible accordion.
export const GameNav = ({ groups, activeGameId, onSelect }) => {
  const [query, setQuery] = useState("");

  if (!groups || groups.length === 0) {
    return (
      <nav data-testid="game-nav-desktop" className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-[1400px] px-4 py-3 text-xs text-gray-400">加载彩种…</div>
      </nav>
    );
  }
  const activeGroup =
    groups.find((g) => g.games.some((game) => game.id === activeGameId))?.id ||
    groups[0].id;

  const q = query.trim();
  const shownGroups = q
    ? groups
        .map((g) => ({ ...g, games: g.games.filter((game) => game.name.includes(q)) }))
        .filter((g) => g.games.length > 0)
    : groups;

  return (
    <>
      {/* Desktop */}
      <nav
        data-testid="game-nav-desktop"
        className="hidden md:block bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-[1400px] px-4 py-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                data-testid="game-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索彩种…"
                className="w-full h-8 pl-8 pr-7 rounded-sm border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:border-red-400"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400">共 {groups.reduce((s, g) => s + g.games.length, 0)} 款彩种</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {shownGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-black tracking-wider px-1.5 py-0.5 rounded-sm shrink-0",
                    group.color === "gold"
                      ? "text-amber-700 bg-amber-50"
                      : "text-red-700 bg-red-50"
                  )}
                >
                  {group.label}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {group.games.map((game) => (
                    <GameTab
                      key={game.id}
                      game={game}
                      active={game.id === activeGameId}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
                <span className="w-px h-6 bg-gray-200 mx-1 shrink-0 last:hidden" />
              </div>
            ))}
            {shownGroups.length === 0 && (
              <span className="text-sm text-gray-400 py-2">未找到匹配「{query}」的彩种</span>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile: grouped collapse */}
      <MobileNav
        groups={groups}
        activeGameId={activeGameId}
        activeGroup={activeGroup}
        onSelect={onSelect}
      />
    </>
  );
};

const MobileNav = ({ groups, activeGameId, activeGroup, onSelect }) => {
  const [value, setValue] = useState(activeGroup);
  return (
    <nav
      data-testid="game-nav-mobile"
      className="md:hidden bg-white border-b border-gray-200"
    >
      <Accordion type="single" collapsible value={value} onValueChange={setValue}>
        {groups.map((group) => {
          const groupActive = group.games.some((g) => g.id === activeGameId);
          return (
            <AccordionItem key={group.id} value={group.id} className="border-b border-gray-100">
              <AccordionTrigger
                data-testid={`game-group-${group.id}`}
                className="px-3 py-2.5 hover:no-underline"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-black tracking-wider px-1.5 py-0.5 rounded-sm",
                      group.color === "gold"
                        ? "text-amber-700 bg-amber-50"
                        : "text-red-700 bg-red-50"
                    )}
                  >
                    {group.label}
                  </span>
                  {groupActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  )}
                  <span className="text-xs text-gray-400">{group.games.length} 项</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {group.games.map((game) => (
                    <GameTab
                      key={game.id}
                      game={game}
                      active={game.id === activeGameId}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </nav>
  );
};
