// Mock data for 胜利28 开奖盘面 (pure frontend visual layer)

export const account = {
  username: "jessie",
  userId: 33,
  beans: 100000,
  bank: 0,
  unread: 3,
};

// Top dark utility bar entries (left side)
export const utilityLinks = [
  { id: "network", label: "网络检测", icon: "Activity" },
  { id: "lottery", label: "抽奖", icon: "Gift" },
  { id: "merchant", label: "商家", icon: "Store" },
  { id: "mobile", label: "手机版", icon: "Smartphone" },
];

// Main navigation menu (below logo)
export const mainMenu = [
  { id: "home", label: "网站首页", to: "/" },
  { id: "activity", label: "活动专区", to: "/activities" },
  { id: "ranking", label: "牛人榜", to: "/rankings" },
  { id: "games", label: "游戏乐园", to: "/games" },
  { id: "exchange", label: "兑换奖品", to: "/shop" },
  { id: "intro", label: "得胜介绍", to: "/intro" },
  { id: "partner", label: "合作商家", to: "/partners" },
  { id: "usercenter", label: "用户中心", to: "/user" },
];

export const activeMenu = "games";

// ~38 game tabs across 6 groups
export const gameGroups = [
  {
    id: "jisu",
    label: "急速",
    color: "red",
    games: [
      { id: "jisu28", name: "急速28" },
      { id: "jisuk3", name: "急速快3" },
      { id: "jisulhc", name: "急速六合彩" },
      { id: "jisupk10", name: "急速PK10" },
      { id: "jisussc", name: "急速时时彩" },
      { id: "jisuft", name: "急速飞艇" },
      { id: "jisu115", name: "急速11选5" },
    ],
  },
  {
    id: "beijing",
    label: "北京",
    color: "gold",
    games: [
      { id: "bj28", name: "北京28" },
      { id: "bjk3", name: "北京快3" },
      { id: "bjpk10", name: "北京赛车" },
      { id: "bjssc", name: "北京时时彩" },
      { id: "bj115", name: "北京11选5" },
      { id: "bjkl8", name: "北京快乐8" },
    ],
  },
  {
    id: "dandan",
    label: "蛋蛋",
    color: "red",
    games: [
      { id: "pcdd", name: "PC蛋蛋" },
      { id: "xydd", name: "幸运蛋蛋" },
      { id: "twdd", name: "台湾蛋蛋" },
      { id: "ffdd", name: "分分蛋蛋" },
      { id: "jsdd", name: "极速蛋蛋" },
    ],
  },
  {
    id: "pk",
    label: "PK",
    color: "gold",
    games: [
      { id: "jspk", name: "极速PK10" },
      { id: "xypk", name: "幸运PK10" },
      { id: "aopk", name: "澳洲PK10" },
      { id: "pk3", name: "3分PK10" },
      { id: "pk5", name: "5分PK10" },
      { id: "pk10m", name: "10分PK10" },
    ],
  },
  {
    id: "canada",
    label: "加拿大",
    color: "red",
    games: [
      { id: "ca28", name: "加拿大28" },
      { id: "cak3", name: "加拿大快3" },
      { id: "capc", name: "加拿大PC" },
      { id: "cax28", name: "加拿大西28" },
      { id: "cakh", name: "加拿大卡红" },
      { id: "ca1.5", name: "加拿大1.5分" },
    ],
  },
  {
    id: "korea",
    label: "韩国",
    color: "gold",
    games: [
      { id: "kr28", name: "韩国28" },
      { id: "krk3", name: "韩国快3" },
      { id: "kr15", name: "韩国1.5分彩" },
      { id: "krssc", name: "韩国时时彩" },
      { id: "krft", name: "韩国飞艇" },
    ],
  },
];

export const activeGame = { groupId: "jisu", gameId: "jisu28", name: "急速28" };

// status: "drawing" | "drawn" | "bet"
function makeDraw(period, numbers, status, minutesAgo) {
  const now = new Date("2026-06-15T21:04:00");
  const t = new Date(now.getTime() - minutesAgo * 60000);
  const drawn = status === "drawn" && numbers;
  const sum = drawn ? numbers.reduce((a, b) => a + b, 0) : null;
  return {
    period,
    drawTime: t.toTimeString().slice(0, 8),
    numbers: drawn ? numbers : null,
    sum,
    bigSmall: drawn ? (sum >= 14 ? "大" : "小") : null,
    oddEven: drawn ? (sum % 2 === 0 ? "双" : "单") : null,
    status,
    totalBeans: drawn ? 1200000 + (period % 97) * 8300 : 0,
    winnerCount: drawn ? 40 + (period % 53) : 0,
    winAmount: drawn ? 320000 + (period % 41) * 4100 : 0,
    betAmount: drawn ? 880000 + (period % 71) * 5200 : 0,
  };
}

let p = 3059875;
export const draws = [
  // upcoming periods — open for betting, no result yet (newest on top)
  makeDraw(p--, null, "bet", -12),
  makeDraw(p--, null, "bet", -9),
  makeDraw(p--, null, "bet", -6),
  makeDraw(p--, null, "bet", -3),
  // current period — drawing now
  makeDraw(p--, null, "drawing", 0),
  // already drawn periods (descending)
  makeDraw(p--, [4, 9, 7], "drawn", 3),
  makeDraw(p--, [2, 8, 3], "drawn", 6),
  makeDraw(p--, [6, 1, 5], "drawn", 9),
  makeDraw(p--, [9, 9, 8], "drawn", 12),
  makeDraw(p--, [0, 3, 4], "drawn", 15),
  makeDraw(p--, [7, 2, 6], "drawn", 18),
  makeDraw(p--, [5, 5, 1], "drawn", 21),
  makeDraw(p--, [3, 8, 9], "drawn", 24),
  makeDraw(p--, [1, 0, 2], "drawn", 27),
  makeDraw(p--, [8, 4, 7], "drawn", 30),
  makeDraw(p--, [6, 6, 3], "drawn", 33),
];

// hero = latest drawn result; nextPeriod = the one currently drawing
export const currentDraw = draws.find((d) => d.status === "drawn");
export const drawingPeriod = draws.find((d) => d.status === "drawing").period;

// Mock bet records for the 投注记录 dialog
export const betRecords = [
  { id: "B20260615-091", period: 3059870, type: "和值大", amount: 2000, result: "win", payout: 3760, time: "21:01:30" },
  { id: "B20260615-090", period: 3059869, type: "组合三同", amount: 500, result: "lose", payout: 0, time: "20:58:22" },
  { id: "B20260615-089", period: 3059868, type: "和值单", amount: 1000, result: "win", payout: 1980, time: "20:55:11" },
  { id: "B20260615-088", period: 3059867, type: "特码7", amount: 300, result: "lose", payout: 0, time: "20:52:47" },
  { id: "B20260615-087", period: 3059866, type: "和值大", amount: 1500, result: "win", payout: 2820, time: "20:49:05" },
  { id: "B20260615-086", period: 3059865, type: "豹子", amount: 200, result: "lose", payout: 0, time: "20:46:33" },
  { id: "B20260615-085", period: 3059864, type: "和值双", amount: 800, result: "win", payout: 1584, time: "20:43:19" },
];

// Game toolbar actions
export const skins = [
  { id: "modern", label: "现代" },
  { id: "retro", label: "怀旧" },
  { id: "classic", label: "经典" },
];

// ---- Trend chart mock data ----
// Ways to make each sum (0-27) from three digits 0-9, out of 1000 combos.
const WAYS = (() => {
  const w = new Array(28).fill(0);
  for (let a = 0; a < 10; a++)
    for (let b = 0; b < 10; b++)
      for (let c = 0; c < 10; c++) w[a + b + c]++;
  return w;
})();

function genTrend(count, startPeriod) {
  const now = new Date("2026-06-15T21:04:00");
  const out = [];
  let seed = 20260615;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    // sum sampled roughly by the ways distribution for realism
    const a = Math.floor(rnd() * 10);
    const b = Math.floor(rnd() * 10);
    const c = Math.floor(rnd() * 10);
    const sum = a + b + c;
    const t = new Date(now.getTime() - i * 3 * 60000);
    out.push({
      period: startPeriod - i,
      time: t.toTimeString().slice(0, 5),
      numbers: [a, b, c],
      sum,
    });
  }
  return out;
}

export const trendWays = WAYS;
export const trendDraws = genTrend(30, 3059870);
export const trendWindows = [
  { id: 30, label: "最新30期" },
  { id: 50, label: "最新50期" },
  { id: 100, label: "最新100期" },
];
