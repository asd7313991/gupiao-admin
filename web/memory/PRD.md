# PRD — 胜利28 / 得胜 平台前端重构

## 原始需求
1) 把老式固定宽度开奖盘面改造成"现代化密集终端"风格(红金、浅色、盯盘)。
2) 后续:提供 ThinkPHP 老项目压缩包(desheng.sql),要求把整站 8 个页面 React 化,并"用压缩包里的 PHP 接口做服务端,只做数据对接,不动原有功能"。
3) 持续优化与新增内容。

## 关键决策
- 环境限制:无法运行 PHP/MySQL 老栈 → 在 FastAPI 中**镜像 PHP 只读接口契约**,数据从 `desheng.sql` 抽取,MongoDB 启动播种。不搬迁投注/派奖/明文密码等后端逻辑(安全)。
- 数据:games(26 类型)、draws(26 彩种各 60 期,共 1560 期)、game_system 赔率、shop 充值卡、site config 为**真实**;news/activity/partner(原 SQL 为测试垃圾)、rankings、user 为**干净示例/脱敏**;写操作仅 toast 不落库。
- 视觉:统一现代红金终端风格;浅色为主 + 深色模式;字体 Manrope/IBM Plex Sans/Mono。

## 架构
- Frontend: React 19 + CRA(craco)+ Tailwind + shadcn/ui + React Router 7 + React Query 5 + sonner + lucide + framer-motion。`@/` alias。
- Backend: FastAPI + Motor(MongoDB),`/api/*` 前缀,startup 幂等播种(meta.seeded_v2),seed JSON 在 `/app/backend/seed/`。
- 接口:/config /games /games/{gid} /draws?gid&page&size /home /activities(/{id}) /news(/{id}) /rankings?scope /shop /partners /user

## 用户画像
高频盯盘下注用户 + 浏览门户(活动/兑换/榜单/资料)的普通会员。

## 已实现(截至 2026-06)
- 开奖盘面(游戏乐园 /games):分组平铺彩种导航 + 搜索、账户条/logo/主菜单、圆环倒计时、开奖信息条(最新开奖+下一期)、超密开奖表(斑马/悬停/固定宽状态徽章/验证)、手机卡片、分页;真实 26 彩种/开奖;多号码(keno/PK10)兼容显示。
- 工具栏:游戏帮助、投注记录、模式编辑(完整投注模式编辑器:标准 chips/倍数/号码赔率表)、走势图(接真实开奖)、自动投注(开发中提示)、皮肤/声音。
- 8 页 React Router:首页(轮播/热门游戏真实封面/礼品真实图/最新活动/公告/玩家排名)、活动专区(卡片+详情弹窗)、牛人榜(日/周/月榜)、游戏乐园、兑换奖品(分类+真实产品图)、得胜介绍、合作商家、用户中心(资料/签到/投注记录/红包/消息)。
- 全站:深色模式(localStorage 持久 + html.dark CSS 覆盖)、返回顶部、骨架屏、动态页面标题、React Query 缓存、移动端首页适配。
- 移动端下注面板(MobileBetPanel.jsx,2026-06):点击「立即投注」进入全屏下注终端,还原老盘面——号码属性快选(大/小/单/双/中/边/大单…小边)、展开更多(尾数 0-9尾/大小尾 + 余数 3余/4余/5余)、倍数(0.1~100倍,全局乘)、彩色筹码(10~10K,选中高亮)、全包/反选/上期/梭哈、自定义定额梭哈、号码赔率表(0-27 波色圆点+精确赔率 1000/ways*0.985、每行 0.5/2/10 倍、投注输入)、底部已投注/本次投注实时汇总、返回/清空/上期/投注。写操作 toast(展示层)。
- 下注面板增强(BetPanel.jsx,统一移动+桌面,2026-06):① 筹码点选下注——点号码圆点用当前筹码累加金额,配 betPop 跳动动画;② 「上期」真实回填——记录上次提交方案(useRef),一键回填各号码金额(首次用示例方案);③ 平板/横屏/大屏专用宽松布局(variant="desktop"):红金顶栏(游戏名/期号/工具栏/余额/关闭)+ 属性分组(基本/尾数/余数/倍数)+ 筹码/定额梭哈/此次总投 + 确认投注/上期投注/梭哈/清空/全包/反选 + 双列号码赔率表(0-13 | 14-27),桌面「马上投注」触发弹层。移动 md:hidden、桌面 hidden md:flex 各一实例,共用 useBetPanel 逻辑。
- 下注闭环(BetPanel.jsx,useBetPanel 生命周期,2026-06):④ 投注确认弹层——点确认投注先弹明细(号码/赔率/金额/预计+中奖 + 投注总额 + 预计最高中奖 + 取消/确认);⑤ 余额扣减动画——确认后本地余额 animateBalance 滚动扣减 + 红闪(balFx);⑥ 倒计时联动锁盘——剩 stop 秒进入「本期已封盘」,输入/按钮全灰化禁用,投注键变「封盘」;⑦ 中奖高亮回放——开奖后已投注列显示 placed 金额,命中号码翠绿高亮环 + Trophy 状态条 + 金豆入账滚动上涨,回放 ~5s 后清场进入下一期。
- 真实开奖对接 + 投注落库(2026-06):后端新增服务端权威回合引擎与真实下注。GET /round?gid(每游戏持久化 rounds_base 基线,期号与历史连续、真实倒计时/开奖时间/封盘 stop=interval*0.25,last 结果 hashlib 确定性生成);POST /bets(校验当期未封盘+余额,扣豆落库 status=pending);POST /bets/settle(到点结算:确定性开奖→按 (1000/ways)*0.985 赔率派奖入账);GET /user/bets(先结算再返回真实记录);GET /user 改读 users 集合真实余额 + 真实 betlog(users/bets 集合,固定脱敏用户 u33)。前端 BetPanel 改用 useQuery(/round) 服务端驱动倒计时/期号,提交走 POST /bets 并 invalidate user,开奖到点 POST /bets/settle 触发回放并回填余额;用户中心「投注记录」改拉 /user/bets(彩种/玩法/待开奖·中奖·未中/派奖/开奖和值)。真实金豆余额随下注/派奖持久变动。
- 兑换扣豆 + 中奖飘豆(2026-06):⑧ 兑换商城真实扣豆——POST /exchange(校验余额→扣豆→生成 orders 订单→商品 buynum+1),GET /user/orders;Shop 我要兑换弹 sonner 确认后调用,成功 invalidate user(顶栏余额同步),余额不足前端+后端双拦截;用户中心新增「兑换订单」Tab(商品图/名称/金豆/处理中/时间)。⑨ 中奖飘豆特效——中奖时按命中号码与余额元素 getBoundingClientRect 计算轨迹,16 枚 lucide Coins 粒子经 coinFly 关键帧(CSS 变量 --tx/--ty/--dx)飞入顶部余额,z-90 pointer-events-none 叠层。
- 金豆图标(2026-06):新建 GoldBean.jsx(金元宝 SVG),全站 10 个文件替换原 lucide Coins 图标(区别于硬币)。
- 移动端整站重构(参考"得胜28"官网,2026-06,仅移动端 <768px,桌面不变):
  - 移动外壳:MobileHeader(固定顶部 h-14 红条 #D81E2C,品牌"得胜28"居中,左抽屉 mainMenu+主题/客服/退出,右金豆 pill)+ MobileTabBar(固定底部 h-16,5 Tab:首页/活动/游戏乐园(居中抬升红金 FAB)/兑换/会员中心);Layout 中桌面 AccountBar 改 hidden md:block,移动壳 md:hidden,main 加 pt-14 pb-16;游戏乐园(/games)排除外壳(保留自身沉浸式)。
  - 移动首页(MobileHome.jsx,block md:hidden / 桌面 hidden md:block 保留):AI 生成主视觉大图(模特+幸运转盘+奖品,新人专享)、5 快捷圆标(公告中心/活动列表→活动,排行榜→牛人榜,充提/每日任务→toast)、红色跑马灯(喇叭+滚动中奖播报 animate-marquee)、左竖排分类导轨(购彩大厅红色高亮+棋牌/群玩法/福彩体彩/得胜约战)+ 右国家系列大卡(加拿大/台湾/新加坡/澳门,AI 模特+国旗图),点击均进入游戏乐园;浮动红包 + 每日倒计时;热门游戏横滑 + 礼品兑换 2 列。
  - 其余页面(活动/牛人榜/兑换/得胜介绍/合作商家/用户中心)沿用新外壳 + 现有响应式卡片,红金风格统一。AI 大图 5 张(hero + 4 国家系列)。
- 首页轮播 + 系列卡直达(2026-06):主视觉改 3 帧轮播 HeroCarousel(新人专享/活动中心/中奖榜,圆点+4s自动+手势滑动,手动切换重置计时,+2 张 AI 大图);修复人脸裁切(hero 与系列卡 object-top、系列卡 h-28)。系列卡/购彩大厅 Link 到 /games?game={id},GameArena 用 useSearchParams 读取 game 参数自动选中彩种(加拿大系列→21加拿大28、台湾→1急速28、新加坡→8北京28、澳门→27韩国28;真实数据无台湾/新加坡/澳门,映射至真实28彩种)。testing_agent 移动端前端 100%。
- 购彩大厅手风琴 + 品牌改名(2026-06):全站"得胜28"→"胜利28"(MobileHeader/抽屉/首页跑马灯,rail 得胜约战→胜利约战)。首页购彩大厅内容区改为接入 /games 真实分组的可展开手风琴:每个"{label}系列"banner(AI 图循环)点击展开该组真实彩种 2 列网格(急速7/北京3/蛋蛋3/PK5/加拿大4/韩国5),默认展开首组,点彩种→/games?game={id} 自动选中;左侧其它分类(棋牌/群玩法/福彩体彩/胜利约战)点击 toast「敬请期待」。
- 导航同步 + 打磨(2026-06):游戏乐园移动端改用共享 MobileHeader(红色胜利28)+ MobileTabBar(与首页一致,移除自定义底栏 BOTTOM);Layout 不再排除 /games,全移动页统一 pt-14 pb-16;游戏内深色栏精简为彩种选择+刷新(删除设置/帮助/树叶/⋮/重复余额)。GoldBean 还原为 lucide Coins(金币)。首页系列默认全收起(activeOpen=openId,点击 toggle),各系列「XX28」旗舰彩种加红色「热」角标(data-testid hot-{id})。
- PC 首页彩种入口改版 + 美女海报(2026-06):桌面首页「热门游戏」下原 6 个小圆角标行(28 chips)改为仿手机端的「购彩大厅·彩种系列」入口卡网格(sm:2列/lg:3列),每个 gameGroup 一张卡:美女模特海报背景(object-top)+ 左侧黑色渐变叠层 + {label}系列 大标题 + 后端 is_hot「热」角标 + {n}款彩种 + 「进入盯盘」按钮,深链 /games?game={旗舰彩种id}(is_hot 优先)。新增 6 张 AI 生成红金模特海报(急速/北京/蛋蛋/PK/加拿大/韩国),SERIES_POSTER 按 label 映射。截图明浅色验证。
- 深色收尾 · 用户中心(2026-06):每日签到「今日已签到」禁用按钮原 bg-gray-300 深色下仍浅灰,加 dark:bg-gray-700 dark:text-gray-400;红包/资料/汇总卡/侧栏/投注记录表复核由全局深色变量接管(金豆卡 amber 淡染、红包红渐变)。至此榜单+商城+用户中心深色闭环。截图验证(签到禁用态、红包页)。
- 深色细节打磨 · 榜单/商城(2026-06):牛人榜名次徽章原 bg-gray-100 深色塌陷,改用 `.num-box` 芯片面可见;亚军领奖台渐变加 dark:from-slate-500 dark:to-slate-700(金属深银,替发白浅灰);兑换商城复核 OK(卡片/分类/价格按钮由全局深色变量接管,商品图自带白底保留)。截图桌面深色验证协调。
- 深色模式协调性修复(2026-06):① 补齐缺失深色变量——`bg-gray-200`(选项卡条 bg-gray-200/70、分隔线、TrendChart 表头、进度条)原深色下仍浅灰,统一为 `#232c3d`;② 号码格子——原 bg-gray-100 深色塌陷成页面底色(#0d1117)不可见,改用独立 `.num-box` 芯片面(浅 #f3f4f6 / 深 #212a3a),MobileGameArena NumBox 采用;③「开奖中」当前期高亮——琥珀低透在深色发浑成棕,改品牌红淡染 bg-red-50/60(MobileGameArena + HistoryTable);④ 和值圆点 ring-red-200/ring-blue-200 深色柔化降刺眼。截图桌面深色验证协调(同一套 CSS 覆盖系统,手机端组件同步)。① 活动详情富文本——后端 ACTIVITY_BODIES 为 5 个活动写结构化 HTML(活动时间/对象/规则 ul/奖励 ul/温馨提示 .tip,红金加粗高亮),activities 集合新增 body 字段(seed 写入 + startup run_migrations 幂等回填已播种库),Activities.jsx 弹窗用 dangerouslySetInnerHTML 渲染 body(index.css .activity-rich 作用域样式,含深色适配),无 body 降级到 content,data-testid activity-rich-body。② 热门角标数据化——games 集合新增 is_hot(is_hot_name:名以 28 结尾;seed 写入 + run_migrations 回填),/games 与 /home 分组返回 is_hot;MobileHome 系列彩种改读 g.is_hot(替代 name.endsWith('28')),GameNav GameTab 新增红「热」角标(data-testid game-hot-{id},选中态隐藏)。首页 + 游戏乐园均显示。截图验证:活动富文本渲染、游戏乐园角标 present=True。

## Backlog / 未来
- P1: 补 PK龙虎(龙/虎结果,非和值)展示;其它彩种走势图坐标适配(和值>27 的 keno)。
- P1: 移动端游戏盘面二次压版;顶部主菜单接真实跳转/权限。
- P2: 活动/公告富文本后台;真实 JWT 登录替代脱敏账户;骨架屏覆盖更多页;深色模式细节打磨。
- P2: 在线咨询悬浮球(用户本轮未选)。

## 数据来源标注
- 真实:游戏类型/名称、开奖(期号/号码/和值/时间)、赔率、站点标题、充值卡商品、商品图(图库)、Banner/游戏封面(生成图)。
- MOCKED/示例/脱敏:活动、公告、合作商家、榜单、用户账户与签到/红包/消息、投注记录;所有写操作。
