"""胜利28 前台数据接口 (FastAPI, 只读展示层)
镜像原 PHP (ThinkPHP) 接口契约, 数据从 desheng.sql 抽取 (games/commodities/system 为真实数据,
内容表 news/activity/hezuo 原为开发测试垃圾数据, 已用干净示例内容替换; 用户数据脱敏)。
"""
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime, timezone
import os, json, html, logging, re, time, hashlib
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger("shengli28")

SEED = ROOT_DIR / "seed"

# ---- image assets (generated covers/banners + product photos) ----
BANNERS = [
    {"img": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/011e03b901b7e2f0b6f06853fdf8a13c732ccae85539130cb7aaa29283387283.jpeg", "title": "充值抽奖 送豪礼", "sub": "单笔满 200 元即可抽奖 · 最高 200000 金豆", "to": "/activities"},
    {"img": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/c49a81e3e725586623c36db6f8b3cee71c0a0e01d9b0052a090f185787627ecc.jpeg", "title": "亏损返利 更有保障", "sub": "每日亏损自动返利到账 · 越玩越安心", "to": "/activities"},
    {"img": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/81fdceca7f6c160a9d00b74fd040cee7e51e3f4fd314b2580e75d81f308249f2.jpeg", "title": "每日签到 领金豆", "sub": "连续签到额外加赠 · 坚持越久奖励越丰厚", "to": "/user"},
]
HOT_GAMES = [
    {"name": "捕鱼达人", "tag": "进入新区", "cover": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/966dfa3099f3206c346af2020d00a8e3d0ecdef7476feae1d9428258235936dc.jpeg"},
    {"name": "神剑仙侠", "tag": "进入新区", "cover": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/2e5c534d646be780316a5a5b051ef1c09753ea1ba334da78a4ff57411980a1e4.jpeg"},
    {"name": "魅影传说", "tag": "进入新区", "cover": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/3319cdb0d6deced121814852f34ed205c39ea7a7cb4df140d74a610741209fa0.jpeg"},
    {"name": "龙破九天", "tag": "进入新区", "cover": "https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/541342dc782ffbc770373fa41fc8ff39ed080d3a45b63cdeb6ed3ecace61ed30.jpeg"},
]
PROD_IMG = {
    "sim": "https://images.unsplash.com/photo-1613243555988-441166d4d6fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "iphone": "https://images.unsplash.com/photo-1611791484670-ce19b801d192?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "watch": "https://images.unsplash.com/photo-1631863552122-3072cf599a46?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "ipad": "https://images.unsplash.com/photo-1585790051609-09928c362a42?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "earbuds": "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "vacuum": "https://images.unsplash.com/photo-1558317374-067fb5f30001?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "dryer": "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "backpack": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "coffee": "https://images.unsplash.com/photo-1766226763302-6a931331de3d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
}

# ---- game groups (derived from real ot_game_system names) ----
GROUP_ORDER = ["急速", "北京", "蛋蛋", "PK", "加拿大", "韩国"]

def group_of(name: str) -> str:
    for g in GROUP_ORDER:
        if name.startswith(g):
            return g
    return "其他"

# activity rich-text bodies (structured HTML, keyed by activity id)
ACTIVITY_BODIES = {
    1: """
<h3>活动时间</h3>
<p>2026-06-01 00:00 ~ 2026-06-30 23:59</p>
<h3>活动对象</h3>
<p>活动期间完成充值的全体注册会员。</p>
<h3>活动规则</h3>
<ul>
  <li>单笔充值满 <b>200 元</b>,即可获得 <b>1 次</b>抽奖机会。</li>
  <li>单日累计充值每满 1000 元,额外赠送 <b>1 次</b>抽奖机会,上限 10 次/日。</li>
  <li>抽奖机会当日有效,次日 00:00 清零,不可累积。</li>
</ul>
<h3>奖励详情</h3>
<ul>
  <li>特等奖:<b>200000 金豆</b> 或 同价值数码大奖(iPhone / Dyson)。</li>
  <li>一等奖:<b>66666 金豆</b>。</li>
  <li>幸运奖:<b>888 ~ 8888 金豆</b> 随机发放。</li>
</ul>
<p class="tip">温馨提示:奖励将于开奖后 24 小时内自动发放至账户,请留意站内消息。</p>
""",
    2: """
<h3>活动时间</h3>
<p>2026-06-13 00:00 ~ 2026-06-24 23:59</p>
<h3>活动说明</h3>
<p>每日盯盘难免有输赢,平台按你当日的<b>净亏损</b>提供阶梯返利,自动到账,越玩越安心。</p>
<h3>返利比例</h3>
<ul>
  <li>净亏损 1000 ~ 4999 金豆:返利 <b>3%</b></li>
  <li>净亏损 5000 ~ 19999 金豆:返利 <b>5%</b></li>
  <li>净亏损 20000 金豆以上:返利 <b>8%</b>(单日封顶 20000 金豆)</li>
</ul>
<h3>发放方式</h3>
<p>系统于次日 <b>10:00</b> 结算前一日数据,返利金豆自动打入账户,无需申请。</p>
<p class="tip">温馨提示:返利以真实投注产生的净亏损为准,对冲、异常投注不计入统计。</p>
""",
    3: """
<h3>活动时间</h3>
<p>长期有效(2026-06-01 起)</p>
<h3>活动说明</h3>
<p>每日登录并在会员中心签到,即可领取金豆奖励,连续签到奖励逐日递增。</p>
<h3>签到奖励</h3>
<ul>
  <li>第 1 天:<b>100 金豆</b></li>
  <li>第 2 ~ 6 天:每日 <b>200 ~ 600 金豆</b> 递增</li>
  <li>第 7 天:<b>2888 金豆</b> 连签大礼</li>
</ul>
<h3>规则</h3>
<ul>
  <li>连续签到中断后从第 1 天重新计算。</li>
  <li>每个自然日仅可签到 1 次,补签需消耗补签卡。</li>
</ul>
<p class="tip">温馨提示:坚持越久,奖励越丰厚,记得每天回来打卡哦。</p>
""",
    4: """
<h3>活动时间</h3>
<p>长期有效(2026-06-01 起)</p>
<h3>活动说明</h3>
<p>邀请好友注册并完成首次游戏,你与好友<b>双方</b>均可获得金豆奖励,推广收益长期有效。</p>
<h3>奖励详情</h3>
<ul>
  <li>好友注册成功:邀请人得 <b>500 金豆</b>。</li>
  <li>好友首次有效投注:双方各得 <b>1888 金豆</b>。</li>
  <li>好友后续投注:邀请人长期享受 <b>1%</b> 流水返佣。</li>
</ul>
<h3>参与方式</h3>
<p>在会员中心获取专属邀请码/链接,分享给好友即可,好友注册时填写邀请码生效。</p>
<p class="tip">温馨提示:严禁使用同一设备或虚假账号刷取邀请奖励,一经发现将取消资格。</p>
""",
    5: """
<h3>活动时间</h3>
<p>每逢周六、周日全天</p>
<h3>活动说明</h3>
<p>周末专属狂欢!指定热门彩种奖池<b>翻倍</b>,更多期次更高赔付,尽情盯盘尽情赢。</p>
<h3>活动内容</h3>
<ul>
  <li>指定"XX28"系列彩种,周末时段赔率上浮 <b>2%</b>。</li>
  <li>整点开启限时<b>奖池翻倍</b>期次,中奖派彩 ×2。</li>
  <li>周末累计投注排行榜 TOP 10 瓜分 <b>100000 金豆</b> 奖池。</li>
</ul>
<p class="tip">温馨提示:翻倍期次以盘面实时提示为准,请理性游戏,量力而行。</p>
""",
}

def is_hot_name(name: str) -> bool:
    return bool(name) and name.endswith("28")

def strip_html(s: str) -> str:
    if not s:
        return ""
    s = html.unescape(s)
    s = re.sub(r"<[^>]+>", "", s)
    return s.strip()

# ---------------- seeding ----------------
async def seed_if_needed():
    if await db.meta.find_one({"_id": "seeded_v2"}):
        return
    games_data = json.loads((SEED / "games.json").read_text(encoding="utf-8"))
    content = json.loads((SEED / "content.json").read_text(encoding="utf-8"))

    # games (game_system -> game catalog)
    gsys = [g for g in games_data["game_system"] if g.get("state") == "1"]
    color_map = {"急速": "red", "北京": "gold", "蛋蛋": "red", "PK": "gold", "加拿大": "red", "韩国": "gold"}
    games = []
    for g in gsys:
        name = g["name"]
        grp = group_of(name)
        odds = [float(x) for x in g.get("betodds", "").split(",") if x.strip()] if g.get("betodds") else []
        cols = [c for c in g.get("betnum", "").split(",") if c.strip()]
        games.append({
            "_id": f"game_{g['id']}",
            "gid": g["id"],
            "name": name,
            "group": grp,
            "color": color_map.get(grp, "red"),
            "columns": cols,           # possible 和值 columns
            "odds": odds,              # standard payout odds aligned to columns
            "interval": int(g.get("interval") or 300),
            "is_hot": is_hot_name(name),
        })
    if games:
        await db.games.delete_many({})
        await db.games.insert_many(games)

    # real draws for ALL game types (from ot_games)
    draws_all = json.loads((SEED / "draws_all.json").read_text(encoding="utf-8"))
    all_docs = []
    for gid, rows in draws_all.items():
        for d in rows:
            all_docs.append({
                "_id": f"draw_{gid}_{d['period']}",
                "gid": gid,
                "period": int(d["period"]),
                "kjtime": int(d["kjtime"]),
                "numbers": d["numbers"],
                "sum": int(d["sum"]),
            })
    if all_docs:
        await db.draws.delete_many({})
        await db.draws.insert_many(all_docs)

    # site config (real)
    sysrow = (content.get("ot_system") or [{}])[0]
    await db.config.replace_one({"_id": "site"}, {
        "_id": "site",
        "title": sysrow.get("title", "胜利28"),
        "copyright": "www.shengli28.com 胜利28 版权所有 · Copyright (C) 2016 · All Rights Reserved · 黔ICP备16005137号-1",
        "keywords": sysrow.get("keywords", ""),
        "description": strip_html(sysrow.get("description", "")),
    }, upsert=True)

    # shop goods: real commodity expanded into a presentable catalog
    base = (content.get("ot_commodities") or [{}])[0]
    categories = [
        {"id": "recharge", "name": "话费充值"},
        {"id": "digital", "name": "数码产品"},
        {"id": "life", "name": "生活好物"},
    ]
    goods = [
        {"name": "手机充值卡 50元", "points": 5000, "cat": "recharge", "hot": 1, "img": PROD_IMG["sim"]},
        {"name": "手机充值卡 100元", "points": 9800, "cat": "recharge", "hot": 1, "img": PROD_IMG["sim"]},
        {"name": "Q币充值 100元", "points": 9600, "cat": "recharge", "hot": 0, "img": PROD_IMG["sim"]},
        {"name": "京东E卡 200元", "points": 19500, "cat": "recharge", "hot": 0, "img": PROD_IMG["coffee"]},
        {"name": "Apple iPhone 15", "points": 580000, "cat": "digital", "hot": 1, "img": PROD_IMG["iphone"]},
        {"name": "Apple Watch", "points": 320000, "cat": "digital", "hot": 1, "img": PROD_IMG["watch"]},
        {"name": "iPad Air", "points": 460000, "cat": "digital", "hot": 0, "img": PROD_IMG["ipad"]},
        {"name": "无线蓝牙耳机", "points": 88000, "cat": "digital", "hot": 0, "img": PROD_IMG["earbuds"]},
        {"name": "小米扫地机器人", "points": 150000, "cat": "life", "hot": 0, "img": PROD_IMG["vacuum"]},
        {"name": "戴森吹风机", "points": 240000, "cat": "life", "hot": 1, "img": PROD_IMG["dryer"]},
        {"name": "星巴克礼品卡", "points": 12000, "cat": "life", "hot": 0, "img": PROD_IMG["coffee"]},
        {"name": "品牌双肩背包", "points": 46000, "cat": "life", "hot": 0, "img": PROD_IMG["backpack"]},
    ]
    docs = []
    for i, x in enumerate(goods):
        docs.append({
            "_id": f"goods_{i}", "id": i, "typeid": x["cat"], "name": x["name"],
            "points": x["points"], "hot": x["hot"], "buynum": 100 + i * 7,
            "img": x["img"], "money": x["points"] // 100,
        })
    await db.shop_categories.delete_many({}); await db.shop_categories.insert_many(
        [{"_id": c["id"], **c} for c in categories])
    await db.shop_goods.delete_many({}); await db.shop_goods.insert_many(docs)

    # activities (SQL rows were dev junk -> clean demo content)
    activities = [
        {"id": 1, "title": "首充送豪礼 · 充值抽大奖", "grade": 3, "mintime": "2026-06-01", "maxtime": "2026-06-30",
         "pic": "b0", "content": "单笔充值满 200 元即可参加充值抽奖活动,最高可得 200000 金豆及豪华数码大奖,充值越多中奖机会越大。"},
        {"id": 2, "title": "亏损返利 · 让你玩的更有保障", "grade": 1, "mintime": "2026-06-13", "maxtime": "2026-06-24",
         "pic": "b1", "content": "每日累计投注亏损可享受高额返利,自动返还至账户金豆,盯盘无忧,越玩越安心。"},
        {"id": 3, "title": "签到有礼 · 天天领金豆", "grade": 2, "mintime": "2026-06-01", "maxtime": "2026-12-31",
         "pic": "b2", "content": "每日登录签到即可领取金豆奖励,连续签到额外加赠,坚持越久奖励越丰厚。"},
        {"id": 4, "title": "邀请好友 · 双人同享奖励", "grade": 2, "mintime": "2026-06-01", "maxtime": "2026-12-31",
         "pic": "b0", "content": "邀请好友注册并游戏,你和好友均可获得金豆奖励,推广收益长期有效。"},
        {"id": 5, "title": "周末狂欢 · 奖池翻倍", "grade": 3, "mintime": "2026-06-07", "maxtime": "2026-06-08",
         "pic": "b1", "content": "每逢周末高额游戏奖池翻倍,更多期次更高赔付,尽情盯盘尽情赢。"},
    ]
    await db.activities.delete_many({}); await db.activities.insert_many(
        [{"_id": f"act_{a['id']}", **a, "body": ACTIVITY_BODIES.get(a["id"], "")} for a in activities])

    # news / 公告
    news = [
        {"id": 1, "title": "关于系统维护升级的公告", "time": "2026-06-14", "content": "为提供更稳定的服务,平台将于每日凌晨进行例行维护,期间部分功能可能短暂不可用,敬请谅解。"},
        {"id": 2, "title": "新增多款热门彩种上线通知", "time": "2026-06-10", "content": "平台新增急速冠亚、PK龙虎等多款玩法,更多期次更快开奖,欢迎体验。"},
        {"id": 3, "title": "关于防范诈骗的安全提示", "time": "2026-06-05", "content": "请广大用户保护好账号密码,官方不会以任何理由索要密码或验证码,谨防上当受骗。"},
        {"id": 4, "title": "兑换商城商品更新公告", "time": "2026-06-01", "content": "商城上架多款数码及生活好物,金豆可直接兑换,数量有限先兑先得。"},
        {"id": 5, "title": "端午节活动安排通知", "time": "2026-05-28", "content": "端午佳节期间开启专属活动,充值返利加码,详情请见活动专区。"},
    ]
    await db.news.delete_many({}); await db.news.insert_many(
        [{"_id": f"news_{n['id']}", **n} for n in news])

    # partners / 合作商家 (SQL junk -> clean)
    partners = [
        {"id": 1, "webname": "中国广告联盟", "weburl": "#", "qq": "800800800", "sort": 9,
         "content": "国内领先的效果营销广告平台,为合作伙伴提供优质流量与推广资源。"},
        {"id": 2, "webname": "星辰游戏工作室", "weburl": "#", "qq": "1652555362", "sort": 8,
         "content": "专注休闲竞技游戏研发与运营,长期稳定的技术与内容合作方。"},
        {"id": 3, "webname": "瑞银支付", "weburl": "#", "qq": "400400400", "sort": 7,
         "content": "安全合规的第三方支付通道服务,保障资金往来快捷稳定。"},
        {"id": 4, "webname": "云盾安全", "weburl": "#", "qq": "955955", "sort": 6,
         "content": "提供 DDoS 防护、风控与数据安全服务,守护平台稳定运行。"},
        {"id": 5, "webname": "极速CDN", "weburl": "#", "qq": "700700", "sort": 5,
         "content": "全球节点内容分发网络,让盯盘更流畅、开奖更实时。"},
        {"id": 6, "webname": "优选礼品供应链", "weburl": "#", "qq": "600600", "sort": 4,
         "content": "为兑换商城提供正品数码与生活好物供应,发货快、品质优。"},
    ]
    await db.partners.delete_many({}); await db.partners.insert_many(
        [{"_id": f"pt_{p['id']}", **p} for p in partners])

    await db.meta.insert_one({"_id": "seeded_v2"})
    logger.info("seed complete")

# ---------------- helpers ----------------
def clean(doc):
    if doc and "_id" in doc and isinstance(doc["_id"], str) and not doc.get("id"):
        pass
    return doc

async def build_rankings(scope: str):
    # deterministic demo rankings (脱敏)
    import random
    seed = {"day": 1, "week": 2, "month": 3}.get(scope, 1)
    rnd = random.Random(seed)
    names = ["盈盈一笑", "稳如老狗", "追号狂人", "夜盘之王", "小赌怡情", "常胜将军", "闷声发财",
             "梭哈不亏", "手气爆棚", "钢铁意志", "红运当头", "淡定哥", "666大顺", "金豆收割机",
             "低调玩家", "神算子", "老司机", "一击必中", "稳健派", "豹子先生"]
    base = {"day": 60000, "week": 220000, "month": 880000}.get(scope, 60000)
    rows = []
    for i in range(20):
        rows.append({
            "rank": i + 1,
            "name": names[i % len(names)] + ("" if i < len(names) else str(i)),
            "user": f"vip_{rnd.randint(1000, 9999)}",
            "get": int(base * (1 - i * 0.035) + rnd.randint(-3000, 3000)),
        })
    return rows

# ---------------- routes ----------------
@api_router.get("/")
async def root():
    return {"message": "shengli28 api"}

@api_router.get("/config")
async def get_config():
    c = await db.config.find_one({"_id": "site"}, {"_id": 0})
    return c or {"title": "胜利28"}

@api_router.get("/games")
async def get_games():
    games = await db.games.find({}, {"odds": 0}).to_list(200)
    groups = {}
    for g in games:
        g.pop("_id", None)
        groups.setdefault(g["group"], []).append({"id": g["gid"], "name": g["name"], "color": g["color"], "is_hot": bool(g.get("is_hot"))})
    ordered = [{"id": grp, "label": grp, "games": groups[grp]} for grp in GROUP_ORDER if grp in groups]
    return {"groups": ordered}

@api_router.get("/games/{gid}")
async def get_game(gid: str):
    g = await db.games.find_one({"gid": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "game not found")
    return g

@api_router.get("/draws")
async def get_draws(gid: str = "1", page: int = 1, size: int = 20):
    total = await db.draws.count_documents({"gid": gid})
    skip = (page - 1) * size
    rows = await db.draws.find({"gid": gid}, {"_id": 0}).sort("period", -1).skip(skip).limit(size).to_list(size)
    return {"total": total, "page": page, "size": size, "draws": rows}

@api_router.get("/home")
async def get_home():
    activities = await db.activities.find({}, {"_id": 0}).sort("id", 1).limit(3).to_list(3)
    news = await db.news.find({}, {"_id": 0}).sort("id", -1).limit(5).to_list(5)
    hot = await db.shop_goods.find({"hot": 1}, {"_id": 0}).limit(4).to_list(4)
    rankings = (await build_rankings("day"))[:10]
    games = await get_games()
    return {"banners": BANNERS, "hotGames": HOT_GAMES, "activities": activities, "news": news, "hotGoods": hot, "rankings": rankings, "gameGroups": games["groups"]}

@api_router.get("/activities")
async def get_activities():
    return {"activities": await db.activities.find({}, {"_id": 0}).sort("id", 1).to_list(50)}

@api_router.get("/activities/{aid}")
async def get_activity(aid: int):
    a = await db.activities.find_one({"id": aid}, {"_id": 0})
    if not a:
        raise HTTPException(404, "activity not found")
    return a

@api_router.get("/news")
async def get_news():
    return {"news": await db.news.find({}, {"_id": 0}).sort("id", -1).to_list(50)}

@api_router.get("/news/{nid}")
async def get_news_item(nid: int):
    n = await db.news.find_one({"id": nid}, {"_id": 0})
    if not n:
        raise HTTPException(404, "news not found")
    return n

@api_router.get("/rankings")
async def get_rankings(scope: str = "day"):
    return {"scope": scope, "rankings": await build_rankings(scope)}

@api_router.get("/shop")
async def get_shop():
    cats = await db.shop_categories.find({}, {"_id": 0}).to_list(20)
    goods = await db.shop_goods.find({}, {"_id": 0}).sort("id", 1).to_list(100)
    hot = [g for g in goods if g.get("hot") == 1][:4]
    return {"categories": cats, "goods": goods, "hot": hot}

@api_router.get("/partners")
async def get_partners():
    return {"partners": await db.partners.find({}, {"_id": 0}).sort("sort", -1).to_list(50)}

@api_router.get("/user")
async def get_user():
    await settle_user()
    u = await ensure_user()
    recent = await db.bets.find({"uid": USER_ID}).sort("created_ts", -1).limit(6).to_list(6)
    betlog = []
    for b in recent:
        betlog.append({
            "period": b["period"], "type": _bet_type(b["items"]), "amount": b["total"],
            "result": b["status"] if b["status"] != "pending" else "wait",
            "payout": b.get("payout", 0),
            "time": datetime.fromtimestamp(b["created_ts"], tz=timezone.utc).strftime("%H:%M"),
        })
    if not betlog:
        betlog = [
            {"period": 55416, "type": "和值大", "amount": 2000, "result": "win", "payout": 3760, "time": "21:01"},
            {"period": 55415, "type": "组合三同", "amount": 500, "result": "lose", "payout": 0, "time": "20:58"},
            {"period": 55414, "type": "和值单", "amount": 1000, "result": "win", "payout": 1980, "time": "20:55"},
            {"period": 55413, "type": "特码7", "amount": 300, "result": "lose", "payout": 0, "time": "20:52"},
        ]
    return {
        "id": u.get("uid", 33), "user": u.get("user", "asd7313991"), "name": u.get("name", "jessie"),
        "points": u["points"], "money": 0, "level": "VIP3",
        "sign": {"days": 6, "todaySigned": False, "reward": 200},
        "messages": [
            {"id": 1, "title": "系统消息", "content": "欢迎回到胜利28,祝你游戏愉快!", "time": "06-15 21:00", "read": False},
            {"id": 2, "title": "充值到账通知", "content": "您的充值 200 元已到账,赠送抽奖 1 次。", "time": "06-14 18:22", "read": True},
            {"id": 3, "title": "活动提醒", "content": "周末奖池翻倍活动即将开始,记得参与。", "time": "06-13 10:05", "read": True},
        ],
        "betlog": betlog,
        "hongbao": [
            {"id": 1, "money": "88", "content": "恭喜发财", "state": 0, "time": "06-15 20:10"},
            {"id": 2, "money": "6.66", "content": "顺顺利利", "state": 1, "time": "06-14 12:00"},
        ],
    }

@api_router.get("/profit")
async def get_profit(days: int = 7):
    import random
    rnd = random.Random(days)
    daily = []
    total_bet = total_win = 0
    from datetime import timedelta
    today = datetime(2026, 6, 15, tzinfo=timezone.utc)
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        bet = rnd.randint(20000, 90000)
        win = int(bet * rnd.uniform(0.78, 1.22))
        total_bet += bet
        total_win += win
        daily.append({"date": d.strftime("%m-%d"), "bet": bet, "win": win, "profit": win - bet})
    profit = total_win - total_bet
    wins = sum(1 for x in daily if x["profit"] >= 0)
    by_game = []
    for name in ["急速28", "北京28", "加拿大28", "PK冠军", "韩国28"]:
        by_game.append({"name": name, "profit": rnd.randint(-40000, 90000)})
    return {
        "summary": {
            "totalBet": total_bet, "totalWin": total_win, "profit": profit,
            "winRate": round(wins / len(daily) * 100, 1), "count": len(daily) * rnd.randint(30, 60),
        },
        "daily": daily,
        "byGame": by_game,
    }

# ---------------- live round + betting (server-authoritative) ----------------
_WAYS = [0] * 28
for _a in range(10):
    for _b in range(10):
        for _c in range(10):
            _WAYS[_a + _b + _c] += 1
ODDS = [round((1000.0 / w) * 0.985, 4) for w in _WAYS]  # payout odds for 和值 0-27

USER_ID = "u33"
DEFAULT_POINTS = 100000

def gen_result(gid: str, period: int):
    """Deterministic draw for a live period (stable across calls/clients)."""
    h = hashlib.sha256(f"{gid}:{period}".encode()).digest()
    nums = [h[0] % 10, h[1] % 10, h[2] % 10]
    return nums, sum(nums)

def stop_seconds(interval: int) -> int:
    return max(15, min(60, int(interval * 0.25)))

async def ensure_user():
    u = await db.users.find_one({"_id": USER_ID})
    if not u:
        u = {"_id": USER_ID, "uid": 33, "user": "asd7313991", "name": "jessie", "points": DEFAULT_POINTS}
        await db.users.insert_one(u)
    return u

async def round_state(gid: str):
    game = await db.games.find_one({"gid": gid})
    if not game:
        raise HTTPException(404, "game not found")
    latest = await db.draws.find_one({"gid": gid}, sort=[("period", -1)])
    if not latest:
        raise HTTPException(404, "no draws for game")
    interval = int(game.get("interval") or 300)
    now = time.time()
    # persisted live baseline (anchored at first access -> keeps periods continuous with history)
    base = await db.rounds_base.find_one({"_id": gid})
    if not base:
        base = {"_id": gid, "base_period": int(latest["period"]) + 1,
                "base_ts": int(now // interval * interval)}
        await db.rounds_base.insert_one(base)
    base_p = int(base["base_period"])
    base_ts = int(base["base_ts"])
    k_drawn = int(max(0.0, now - base_ts) // interval)  # live periods completed since baseline
    cur_p = base_p + k_drawn
    cur_ts = base_ts + (k_drawn + 1) * interval
    secs_left = int(round(cur_ts - now))
    stop = stop_seconds(interval)
    secs_to_stop = max(0, secs_left - stop)
    if k_drawn >= 1:
        last_p = base_p + k_drawn - 1
        last_ts = base_ts + k_drawn * interval
        nums, s = gen_result(gid, last_p)
    else:
        last_p, last_ts, nums, s = int(latest["period"]), int(latest["kjtime"]), latest["numbers"], int(latest["sum"])
    return {
        "gid": gid, "game_name": game["name"], "interval": interval, "bet_stop_seconds": stop,
        "current": {"period": cur_p, "draw_ts": int(cur_ts), "seconds_left": secs_left,
                    "seconds_to_stop": secs_to_stop, "open": secs_to_stop > 0},
        "last": {"period": last_p, "draw_ts": int(last_ts), "numbers": nums, "sum": s},
    }

async def settle_user(uid: str = USER_ID):
    """Settle any pending bets whose draw time has passed; credit payouts."""
    now = time.time()
    pend = await db.bets.find({"uid": uid, "status": "pending"}).to_list(500)
    settled, total_payout = [], 0
    for b in pend:
        if b["draw_ts"] > now:
            continue
        nums, s = gen_result(b["gid"], b["period"])
        amt = b["items"].get(str(s), 0)
        payout = int(round(float(amt) * ODDS[s])) if amt else 0
        result = "win" if payout > 0 else "lose"
        await db.bets.update_one({"_id": b["_id"]}, {"$set": {
            "status": result, "result_numbers": nums, "result_sum": s,
            "payout": payout, "settled_ts": now}})
        total_payout += payout
        settled.append({"bet_id": b["_id"], "period": b["period"], "result": result,
                        "result_numbers": nums, "result_sum": s, "payout": payout})
    if total_payout > 0:
        await db.users.update_one({"_id": uid}, {"$inc": {"points": total_payout}})
    return settled

def _bet_type(items: dict) -> str:
    picks = sorted(int(k) for k in items.keys())
    if len(picks) <= 6:
        return "和值 " + ",".join(str(p) for p in picks)
    return f"和值 {len(picks)} 个号码"

class BetIn(BaseModel):
    gid: str
    period: int
    items: dict  # { "13": 2000, ... } 和值 -> 投注金额

@api_router.get("/round")
async def get_round(gid: str = "1"):
    await ensure_user()
    await settle_user()
    return await round_state(gid)

@api_router.post("/bets")
async def place_bet(body: BetIn):
    await ensure_user()
    rs = await round_state(body.gid)
    cur = rs["current"]
    if body.period != cur["period"] or not cur["open"]:
        raise HTTPException(400, "本期已封盘或期号无效,请刷新后重试")
    items = {str(k): int(v) for k, v in body.items.items() if v and int(v) > 0}
    total = sum(items.values())
    if total <= 0:
        raise HTTPException(400, "请先下注")
    u = await db.users.find_one({"_id": USER_ID})
    if u["points"] < total:
        raise HTTPException(400, "金豆余额不足")
    await db.users.update_one({"_id": USER_ID}, {"$inc": {"points": -total}})
    bet = {"_id": f"bet_{int(time.time() * 1000)}_{body.period}", "uid": USER_ID,
           "gid": body.gid, "game_name": rs["game_name"], "period": body.period,
           "items": items, "total": total, "status": "pending",
           "draw_ts": cur["draw_ts"], "created_ts": time.time()}
    await db.bets.insert_one(bet)
    u2 = await db.users.find_one({"_id": USER_ID})
    return {"bet_id": bet["_id"], "balance": u2["points"], "period": body.period,
            "draw_ts": cur["draw_ts"], "total": total}

@api_router.post("/bets/settle")
async def settle_bets():
    settled = await settle_user()
    u = await db.users.find_one({"_id": USER_ID})
    return {"settled": settled, "balance": (u or {}).get("points", 0)}

@api_router.get("/user/bets")
async def get_user_bets(limit: int = 30):
    await settle_user()
    rows = await db.bets.find({"uid": USER_ID}).sort("created_ts", -1).limit(limit).to_list(limit)
    out = []
    for b in rows:
        out.append({
            "id": b["_id"], "period": b["period"], "game": b.get("game_name", ""),
            "type": _bet_type(b["items"]), "amount": b["total"],
            "result": b["status"], "payout": b.get("payout", 0),
            "result_sum": b.get("result_sum"), "result_numbers": b.get("result_numbers"),
            "time": datetime.fromtimestamp(b["created_ts"], tz=timezone.utc).strftime("%m-%d %H:%M"),
        })
    return {"bets": out}

class ExchangeIn(BaseModel):
    goods_id: int

@api_router.post("/exchange")
async def exchange(body: ExchangeIn):
    await ensure_user()
    g = await db.shop_goods.find_one({"id": body.goods_id})
    if not g:
        raise HTTPException(404, "商品不存在")
    u = await db.users.find_one({"_id": USER_ID})
    if u["points"] < g["points"]:
        raise HTTPException(400, "金豆不足,无法兑换")
    await db.users.update_one({"_id": USER_ID}, {"$inc": {"points": -g["points"]}})
    await db.shop_goods.update_one({"id": body.goods_id}, {"$inc": {"buynum": 1}})
    order = {"_id": f"ord_{int(time.time() * 1000)}", "uid": USER_ID, "goods_id": g["id"],
             "name": g["name"], "points": g["points"], "img": g.get("img"),
             "status": "processing", "created_ts": time.time()}
    await db.orders.insert_one(order)
    u2 = await db.users.find_one({"_id": USER_ID})
    return {"order_id": order["_id"], "balance": u2["points"], "name": g["name"], "points": g["points"]}

@api_router.get("/user/orders")
async def user_orders(limit: int = 30):
    rows = await db.orders.find({"uid": USER_ID}).sort("created_ts", -1).limit(limit).to_list(limit)
    out = [{
        "id": o["_id"], "name": o["name"], "points": o["points"], "img": o.get("img"),
        "status": o.get("status", "processing"),
        "time": datetime.fromtimestamp(o["created_ts"], tz=timezone.utc).strftime("%m-%d %H:%M"),
    } for o in rows]
    return {"orders": out}

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

async def run_migrations():
    # backfill is_hot on games and rich-text body on activities (already-seeded DBs)
    async for g in db.games.find({"is_hot": {"$exists": False}}, {"gid": 1, "name": 1}):
        await db.games.update_one({"_id": g["_id"]}, {"$set": {"is_hot": is_hot_name(g.get("name", ""))}})
    for aid, body in ACTIVITY_BODIES.items():
        await db.activities.update_one(
            {"id": aid, "$or": [{"body": {"$exists": False}}, {"body": ""}]},
            {"$set": {"body": body}})

@app.on_event("startup")
async def startup():
    await seed_if_needed()
    await run_migrations()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
