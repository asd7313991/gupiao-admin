import { Link } from "react-router-dom";
import { ShieldCheck, Gamepad2, Gift, TrendingUp, ArrowRight } from "lucide-react";
import { GoldBean } from "@/components/GoldBean";

const FEATURE = "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/6149f6eb236db1458514ba3c2c5a45230f614a7f20d96d73d5696434fcc45bc5.jpeg";

const CARDS = [
  { icon: Gamepad2, t: "游戏最多最全", d: "急速、北京、蛋蛋、PK、加拿大、韩国 六大系列共 27+ 款玩法,快开急开任你选。", c: "bg-red-600" },
  { icon: GoldBean, t: "充值送抽奖", d: "单笔充值满额即得抽奖机会,金豆、数码大奖等你来拿。", c: "bg-amber-500" },
  { icon: TrendingUp, t: "亏损返利高", d: "每日亏损自动返利到账,让你玩得更有保障、更安心。", c: "bg-rose-500" },
  { icon: Gift, t: "高额游戏奖池", d: "周末奖池翻倍,更高赔付更多惊喜,盯盘乐趣加倍。", c: "bg-orange-500" },
];

export default function Intro() {
  return (
    <div>
      {/* hero */}
      <section className="relative overflow-hidden bg-gray-900">
        <img src={FEATURE} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-red-900/40" />
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-red-900 text-xs font-black mb-4"><ShieldCheck className="w-3.5 h-3.5" /> 业内著名诚信网站</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">得胜介绍 · 关于胜利<span className="text-amber-400">28</span></h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            胜利28 是一个集游戏娱乐、竞猜、广告体验于一体的网络效果营销平台。通过引进各种有奖游戏,让用户在休闲娱乐中完成知识与信息的传播,并获得游戏虚拟货币。通过金豆的积累,用户可兑换丰厚奖品。
          </p>
          <Link to="/games" className="inline-flex items-center gap-2 h-11 px-6 mt-6 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold transition-all active:scale-95">立即体验 <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-[1200px] px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CARDS.map((f) => (
            <div key={f.t} className="rounded-lg border border-gray-200 bg-white shadow-sm p-5 hover:-translate-y-1 hover:shadow-md transition-all">
              <span className={`inline-flex w-11 h-11 rounded-md ${f.c} items-center justify-center mb-3`}><f.icon className="w-5 h-5 text-white" /></span>
              <h3 className="font-black text-gray-900 mb-1.5">{f.t}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 text-center">
          {[["27+", "游戏玩法"], ["210s", "极速开奖"], ["100%", "诚信保障"], ["7×24", "全天运营"]].map(([n, l]) => (
            <div key={l} className="rounded-lg border border-gray-200 bg-white shadow-sm py-6">
              <div className="text-3xl font-black font-mono text-red-600">{n}</div>
              <div className="text-sm text-gray-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
