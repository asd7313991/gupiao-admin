-- =============================================================================
-- go28.sql  —  胜利28 平台 MySQL 建表 + 种子数据
-- 由当前 React + FastAPI + MongoDB 项目的数据模型迁移而来(1:1 对齐 server.py)
-- 目标数据库: MySQL 8.0+ (utf8mb4)
-- 用法:  mysql -u root -p < go28.sql
-- 说明:
--   * 原项目用 MongoDB 集合,这里按等价关系表重建。
--   * JSON 类型字段(numbers/items/columns/odds)需要 MySQL 5.7+ / 8.0。
--   * 时间戳沿用后端语义:*_ts 为 Unix 秒(DOUBLE);内容表 time/mintime 为字符串日期。
--   * rankings(牛人榜)与 profit(盈利统计)在后端是"确定性随机生成",不落库 -> 无对应表。
--   * banners / hot_games 目前在 server.py 里是硬编码常量,这里给出表以便你彻底数据化。
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `go28` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `go28`;

-- -----------------------------------------------------------------------------
-- 1) 站点配置  (Mongo: config, _id="site")
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `config`;
CREATE TABLE `config` (
  `id`          VARCHAR(32)  NOT NULL DEFAULT 'site',
  `title`       VARCHAR(128) NOT NULL DEFAULT '胜利28',
  `copyright`   VARCHAR(255) NOT NULL DEFAULT '',
  `keywords`    VARCHAR(255) NOT NULL DEFAULT '',
  `description` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `config` (`id`,`title`,`copyright`,`keywords`,`description`) VALUES
('site','胜利28','www.shengli28.com 胜利28 版权所有 · Copyright (C) 2016 · All Rights Reserved · 黔ICP备16005137号-1','胜利28,急速28,盯盘,开奖','现代化红金终端风格的盯盘/开奖展示平台。');

-- -----------------------------------------------------------------------------
-- 2) 彩种目录  (Mongo: games)  gid 为业务主键
--    group 分组: 急速/北京/蛋蛋/PK/加拿大/韩国   color: red/gold
--    is_hot: 是否首页/游戏乐园显示"热"角标(当前规则=名称以 28 结尾)
--    columns/odds: 和值列与赔率(JSON);本 demo 结算用 (1000/ways)*0.985 动态计算,可留空
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `games`;
CREATE TABLE `games` (
  `gid`      VARCHAR(16)  NOT NULL,
  `name`     VARCHAR(64)  NOT NULL,
  `grp`      VARCHAR(32)  NOT NULL,             -- 原 Mongo 字段名 group(MySQL 保留字,改名 grp)
  `color`    VARCHAR(16)  NOT NULL DEFAULT 'red',
  `columns`  JSON         NULL,
  `odds`     JSON         NULL,
  `interval` INT          NOT NULL DEFAULT 210, -- 单期时长(秒)
  `is_hot`   TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`gid`),
  KEY `idx_grp` (`grp`),
  KEY `idx_hot` (`is_hot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- gid 1..27 顺序对应分组;is_hot=1 为各系列"XX28"旗舰彩种
INSERT INTO `games` (`gid`,`name`,`grp`,`color`,`interval`,`is_hot`) VALUES
('1','急速28','急速','red',210,1),
('2','急速10','急速','red',210,0),
('3','急速11','急速','red',210,0),
('4','急速16','急速','red',210,0),
('5','急速22','急速','red',210,0),
('6','急速36','急速','red',210,0),
('7','急速冠亚','急速','red',210,0),
('8','北京28','北京','gold',210,1),
('9','北京16','北京','gold',210,0),
('10','北京36','北京','gold',210,0),
('11','蛋蛋28','蛋蛋','red',210,1),
('12','蛋蛋36','蛋蛋','red',210,0),
('13','蛋蛋16','蛋蛋','red',210,0),
('14','PK冠军','PK','gold',210,0),
('15','PK10','PK','gold',210,0),
('16','PK22','PK','gold',210,0),
('17','PK龙虎','PK','gold',210,0),
('18','PK冠亚军','PK','gold',210,0),
('21','加拿大28','加拿大','red',210,1),
('22','加拿大11','加拿大','red',210,0),
('23','加拿大16','加拿大','red',210,0),
('24','加拿大36','加拿大','red',210,0),
('27','韩国28','韩国','gold',210,1),
('28','韩国11','韩国','gold',210,0),
('29','韩国16','韩国','gold',210,0),
('30','韩国36','韩国','gold',210,0),
('31','韩国10','韩国','gold',210,0);

-- -----------------------------------------------------------------------------
-- 3) 历史开奖  (Mongo: draws)  一彩种多期
--    numbers: JSON 数组(如 [6,5,3]);sum: 和值;kjtime: 开奖 Unix 秒
--    原项目每彩种约 60 期(共 ~1560 期),请从你的真实数据源批量导入。
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `draws`;
CREATE TABLE `draws` (
  `id`      BIGINT       NOT NULL AUTO_INCREMENT,
  `gid`     VARCHAR(16)  NOT NULL,
  `period`  BIGINT       NOT NULL,
  `kjtime`  BIGINT       NOT NULL,           -- 开奖时间 Unix 秒
  `numbers` JSON         NOT NULL,
  `sum`     INT          NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gid_period` (`gid`,`period`),
  KEY `idx_gid_period` (`gid`,`period` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 示例数据(gid=1 急速28),仅供启动验证,请替换为真实开奖
INSERT INTO `draws` (`gid`,`period`,`kjtime`,`numbers`,`sum`) VALUES
('1',55416, UNIX_TIMESTAMP('2026-06-15 02:00:00'), JSON_ARRAY(6,5,3),14),
('1',55415, UNIX_TIMESTAMP('2026-06-15 01:55:00'), JSON_ARRAY(2,6,8),16),
('1',55414, UNIX_TIMESTAMP('2026-06-15 01:50:00'), JSON_ARRAY(7,4,1),12),
('1',55413, UNIX_TIMESTAMP('2026-06-15 01:45:00'), JSON_ARRAY(1,1,7),9),
('1',55412, UNIX_TIMESTAMP('2026-06-15 01:40:00'), JSON_ARRAY(7,9,1),17);

-- -----------------------------------------------------------------------------
-- 4) 兑换商城分类  (Mongo: shop_categories)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `shop_categories`;
CREATE TABLE `shop_categories` (
  `id`   VARCHAR(32)  NOT NULL,
  `name` VARCHAR(64)  NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `shop_categories` (`id`,`name`) VALUES
('recharge','话费充值'),
('digital','数码产品'),
('life','生活好物');

-- -----------------------------------------------------------------------------
-- 5) 兑换商城商品  (Mongo: shop_goods)
--    points: 兑换所需金豆;money: 参考金额(points/100);hot: 热门;buynum: 已兑数量
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `shop_goods`;
CREATE TABLE `shop_goods` (
  `id`     INT          NOT NULL,
  `typeid` VARCHAR(32)  NOT NULL,
  `name`   VARCHAR(128) NOT NULL,
  `points` INT          NOT NULL,
  `hot`    TINYINT(1)   NOT NULL DEFAULT 0,
  `buynum` INT          NOT NULL DEFAULT 0,
  `img`    VARCHAR(512) NULL,
  `money`  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`typeid`),
  KEY `idx_hot` (`hot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `shop_goods` (`id`,`typeid`,`name`,`points`,`hot`,`buynum`,`img`,`money`) VALUES
(0,'recharge','手机充值卡 50元',5000,1,100,'https://images.unsplash.com/photo-1613243555988-441166d4d6fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',50),
(1,'recharge','手机充值卡 100元',9800,1,107,'https://images.unsplash.com/photo-1613243555988-441166d4d6fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',98),
(2,'recharge','Q币充值 100元',9600,0,114,'https://images.unsplash.com/photo-1613243555988-441166d4d6fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',96),
(3,'recharge','京东E卡 200元',19500,0,121,'https://images.unsplash.com/photo-1766226763302-6a931331de3d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',195),
(4,'digital','Apple iPhone 15',580000,1,128,'https://images.unsplash.com/photo-1611791484670-ce19b801d192?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',5800),
(5,'digital','Apple Watch',320000,1,135,'https://images.unsplash.com/photo-1631863552122-3072cf599a46?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',3200),
(6,'digital','iPad Air',460000,0,142,'https://images.unsplash.com/photo-1585790051609-09928c362a42?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',4600),
(7,'digital','无线蓝牙耳机',88000,0,149,'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',880),
(8,'life','小米扫地机器人',150000,0,156,'https://images.unsplash.com/photo-1558317374-067fb5f30001?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',1500),
(9,'life','戴森吹风机',240000,1,163,'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',2400),
(10,'life','星巴克礼品卡',12000,0,170,'https://images.unsplash.com/photo-1766226763302-6a931331de3d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',120),
(11,'life','品牌双肩背包',46000,0,177,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',460);

-- -----------------------------------------------------------------------------
-- 6) 活动专区  (Mongo: activities)  body 为富文本 HTML
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `activities`;
CREATE TABLE `activities` (
  `id`      INT          NOT NULL,
  `title`   VARCHAR(128) NOT NULL,
  `grade`   INT          NOT NULL DEFAULT 1,
  `mintime` VARCHAR(32)  NOT NULL,
  `maxtime` VARCHAR(32)  NOT NULL,
  `pic`     VARCHAR(32)  NULL,
  `content` VARCHAR(512) NOT NULL,   -- 摘要(卡片显示)
  `body`    MEDIUMTEXT   NULL,       -- 富文本详情(弹窗渲染)
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `activities` (`id`,`title`,`grade`,`mintime`,`maxtime`,`pic`,`content`,`body`) VALUES
(1,'首充送豪礼 · 充值抽大奖',3,'2026-06-01','2026-06-30','b0','单笔充值满 200 元即可参加充值抽奖活动,最高可得 200000 金豆及豪华数码大奖,充值越多中奖机会越大。',
'<h3>活动时间</h3><p>2026-06-01 00:00 ~ 2026-06-30 23:59</p><h3>活动对象</h3><p>活动期间完成充值的全体注册会员。</p><h3>活动规则</h3><ul><li>单笔充值满 <b>200 元</b>,即可获得 <b>1 次</b>抽奖机会。</li><li>单日累计充值每满 1000 元,额外赠送 <b>1 次</b>抽奖机会,上限 10 次/日。</li><li>抽奖机会当日有效,次日 00:00 清零,不可累积。</li></ul><h3>奖励详情</h3><ul><li>特等奖:<b>200000 金豆</b> 或 同价值数码大奖(iPhone / Dyson)。</li><li>一等奖:<b>66666 金豆</b>。</li><li>幸运奖:<b>888 ~ 8888 金豆</b> 随机发放。</li></ul><p class="tip">温馨提示:奖励将于开奖后 24 小时内自动发放至账户,请留意站内消息。</p>'),
(2,'亏损返利 · 让你玩的更有保障',1,'2026-06-13','2026-06-24','b1','每日累计投注亏损可享受高额返利,自动返还至账户金豆,盯盘无忧,越玩越安心。',
'<h3>活动时间</h3><p>2026-06-13 00:00 ~ 2026-06-24 23:59</p><h3>活动说明</h3><p>每日盯盘难免有输赢,平台按你当日的<b>净亏损</b>提供阶梯返利,自动到账,越玩越安心。</p><h3>返利比例</h3><ul><li>净亏损 1000 ~ 4999 金豆:返利 <b>3%</b></li><li>净亏损 5000 ~ 19999 金豆:返利 <b>5%</b></li><li>净亏损 20000 金豆以上:返利 <b>8%</b>(单日封顶 20000 金豆)</li></ul><h3>发放方式</h3><p>系统于次日 <b>10:00</b> 结算前一日数据,返利金豆自动打入账户,无需申请。</p><p class="tip">温馨提示:返利以真实投注产生的净亏损为准,对冲、异常投注不计入统计。</p>'),
(3,'签到有礼 · 天天领金豆',2,'2026-06-01','2026-12-31','b2','每日登录签到即可领取金豆奖励,连续签到额外加赠,坚持越久奖励越丰厚。',
'<h3>活动时间</h3><p>长期有效(2026-06-01 起)</p><h3>活动说明</h3><p>每日登录并在会员中心签到,即可领取金豆奖励,连续签到奖励逐日递增。</p><h3>签到奖励</h3><ul><li>第 1 天:<b>100 金豆</b></li><li>第 2 ~ 6 天:每日 <b>200 ~ 600 金豆</b> 递增</li><li>第 7 天:<b>2888 金豆</b> 连签大礼</li></ul><h3>规则</h3><ul><li>连续签到中断后从第 1 天重新计算。</li><li>每个自然日仅可签到 1 次,补签需消耗补签卡。</li></ul><p class="tip">温馨提示:坚持越久,奖励越丰厚,记得每天回来打卡哦。</p>'),
(4,'邀请好友 · 双人同享奖励',2,'2026-06-01','2026-12-31','b0','邀请好友注册并游戏,你和好友均可获得金豆奖励,推广收益长期有效。',
'<h3>活动时间</h3><p>长期有效(2026-06-01 起)</p><h3>活动说明</h3><p>邀请好友注册并完成首次游戏,你与好友<b>双方</b>均可获得金豆奖励,推广收益长期有效。</p><h3>奖励详情</h3><ul><li>好友注册成功:邀请人得 <b>500 金豆</b>。</li><li>好友首次有效投注:双方各得 <b>1888 金豆</b>。</li><li>好友后续投注:邀请人长期享受 <b>1%</b> 流水返佣。</li></ul><h3>参与方式</h3><p>在会员中心获取专属邀请码/链接,分享给好友即可,好友注册时填写邀请码生效。</p><p class="tip">温馨提示:严禁使用同一设备或虚假账号刷取邀请奖励,一经发现将取消资格。</p>'),
(5,'周末狂欢 · 奖池翻倍',3,'2026-06-07','2026-06-08','b1','每逢周末高额游戏奖池翻倍,更多期次更高赔付,尽情盯盘尽情赢。',
'<h3>活动时间</h3><p>每逢周六、周日全天</p><h3>活动说明</h3><p>周末专属狂欢!指定热门彩种奖池<b>翻倍</b>,更多期次更高赔付,尽情盯盘尽情赢。</p><h3>活动内容</h3><ul><li>指定"XX28"系列彩种,周末时段赔率上浮 <b>2%</b>。</li><li>整点开启限时<b>奖池翻倍</b>期次,中奖派彩 ×2。</li><li>周末累计投注排行榜 TOP 10 瓜分 <b>100000 金豆</b> 奖池。</li></ul><p class="tip">温馨提示:翻倍期次以盘面实时提示为准,请理性游戏,量力而行。</p>');

-- -----------------------------------------------------------------------------
-- 7) 新闻公告  (Mongo: news)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `news`;
CREATE TABLE `news` (
  `id`      INT          NOT NULL,
  `title`   VARCHAR(128) NOT NULL,
  `time`    VARCHAR(32)  NOT NULL,
  `content` TEXT         NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `news` (`id`,`title`,`time`,`content`) VALUES
(1,'关于系统维护升级的公告','2026-06-14','为提供更稳定的服务,平台将于每日凌晨进行例行维护,期间部分功能可能短暂不可用,敬请谅解。'),
(2,'新增多款热门彩种上线通知','2026-06-10','平台新增急速冠亚、PK龙虎等多款玩法,更多期次更快开奖,欢迎体验。'),
(3,'关于防范诈骗的安全提示','2026-06-05','请广大用户保护好账号密码,官方不会以任何理由索要密码或验证码,谨防上当受骗。'),
(4,'兑换商城商品更新公告','2026-06-01','商城上架多款数码及生活好物,金豆可直接兑换,数量有限先兑先得。'),
(5,'端午节活动安排通知','2026-05-28','端午佳节期间开启专属活动,充值返利加码,详情请见活动专区。');

-- -----------------------------------------------------------------------------
-- 8) 合作商家  (Mongo: partners)  sort 倒序展示
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `partners`;
CREATE TABLE `partners` (
  `id`      INT          NOT NULL,
  `webname` VARCHAR(64)  NOT NULL,
  `weburl`  VARCHAR(255) NOT NULL DEFAULT '#',
  `qq`      VARCHAR(32)  NULL,
  `sort`    INT          NOT NULL DEFAULT 0,
  `content` VARCHAR(512) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `partners` (`id`,`webname`,`weburl`,`qq`,`sort`,`content`) VALUES
(1,'中国广告联盟','#','800800800',9,'国内领先的效果营销广告平台,为合作伙伴提供优质流量与推广资源。'),
(2,'星辰游戏工作室','#','1652555362',8,'专注休闲竞技游戏研发与运营,长期稳定的技术与内容合作方。'),
(3,'瑞银支付','#','400400400',7,'安全合规的第三方支付通道服务,保障资金往来快捷稳定。'),
(4,'云盾安全','#','955955',6,'提供 DDoS 防护、风控与数据安全服务,守护平台稳定运行。'),
(5,'极速CDN','#','700700',5,'全球节点内容分发网络,让盯盘更流畅、开奖更实时。'),
(6,'优选礼品供应链','#','600600',4,'为兑换商城提供正品数码与生活好物供应,发货快、品质优。');

-- -----------------------------------------------------------------------------
-- 9) 用户  (Mongo: users)  当前 demo 固定脱敏账户 u33
--    真实迁移时:补充 password_hash / phone / vip 等,points 为金豆余额
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`     VARCHAR(32)  NOT NULL,          -- 原 Mongo _id(如 'u33')
  `uid`    INT          NOT NULL,
  `user`   VARCHAR(64)  NOT NULL,          -- 登录账号
  `name`   VARCHAR(64)  NOT NULL,          -- 昵称
  `points` BIGINT       NOT NULL DEFAULT 0,-- 金豆余额
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_uid` (`uid`),
  UNIQUE KEY `uq_user` (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`id`,`uid`,`user`,`name`,`points`) VALUES
('u33',33,'asd7313991','jessie',100000);

-- -----------------------------------------------------------------------------
-- 10) 投注记录  (Mongo: bets)
--     items: JSON 对象 { "和值": 金额 } 如 {"13":2000}
--     status: pending / win / lose
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `bets`;
CREATE TABLE `bets` (
  `id`             VARCHAR(64) NOT NULL,     -- 原 Mongo _id
  `uid`            VARCHAR(32) NOT NULL,     -- 关联 users.id
  `gid`            VARCHAR(16) NOT NULL,
  `game_name`      VARCHAR(64) NOT NULL,
  `period`         BIGINT      NOT NULL,
  `items`          JSON        NOT NULL,
  `total`          BIGINT      NOT NULL,
  `status`         VARCHAR(16) NOT NULL DEFAULT 'pending',
  `draw_ts`        DOUBLE      NOT NULL,     -- 该期开奖 Unix 秒
  `created_ts`     DOUBLE      NOT NULL,
  `result_numbers` JSON        NULL,
  `result_sum`     INT         NULL,
  `payout`         BIGINT      NOT NULL DEFAULT 0,
  `settled_ts`     DOUBLE      NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uid_created` (`uid`,`created_ts`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 11) 兑换订单  (Mongo: orders)
--     status: processing / done
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id`         VARCHAR(64)  NOT NULL,
  `uid`        VARCHAR(32)  NOT NULL,
  `goods_id`   INT          NOT NULL,
  `name`       VARCHAR(128) NOT NULL,
  `points`     INT          NOT NULL,
  `img`        VARCHAR(512) NULL,
  `status`     VARCHAR(16)  NOT NULL DEFAULT 'processing',
  `created_ts` DOUBLE       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uid_created` (`uid`,`created_ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 12) 实时回合基线  (Mongo: rounds_base)  每彩种一行,锚定期号与历史连续
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `rounds_base`;
CREATE TABLE `rounds_base` (
  `gid`         VARCHAR(16) NOT NULL,
  `base_period` BIGINT      NOT NULL,
  `base_ts`     BIGINT      NOT NULL,
  PRIMARY KEY (`gid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 13) (可选) 首页轮播 Banner  —  当前 server.py 中为硬编码常量 BANNERS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id`   INT          NOT NULL AUTO_INCREMENT,
  `img`  VARCHAR(512) NOT NULL,
  `title`VARCHAR(128) NOT NULL,
  `sub`  VARCHAR(255) NULL,
  `link` VARCHAR(128) NULL,
  `sort` INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `banners` (`img`,`title`,`sub`,`link`,`sort`) VALUES
('https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/011e03b901b7e2f0b6f06853fdf8a13c732ccae85539130cb7aaa29283387283.jpeg','充值抽奖 送豪礼','单笔满 200 元即可抽奖 · 最高 200000 金豆','/activities',3),
('https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/c49a81e3e725586623c36db6f8b3cee71c0a0e01d9b0052a090f185787627ecc.jpeg','亏损返利 更有保障','每日亏损自动返利到账 · 越玩越安心','/activities',2),
('https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/81fdceca7f6c160a9d00b74fd040cee7e51e3f4fd314b2580e75d81f308249f2.jpeg','每日签到 领金豆','连续签到额外加赠 · 坚持越久奖励越丰厚','/user',1);

-- -----------------------------------------------------------------------------
-- 14) (可选) 首页热门游戏卡  —  当前 server.py 中为硬编码常量 HOT_GAMES
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `hot_games`;
CREATE TABLE `hot_games` (
  `id`    INT          NOT NULL AUTO_INCREMENT,
  `name`  VARCHAR(64)  NOT NULL,
  `tag`   VARCHAR(32)  NOT NULL DEFAULT '进入新区',
  `cover` VARCHAR(512) NOT NULL,
  `sort`  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `hot_games` (`name`,`tag`,`cover`,`sort`) VALUES
('捕鱼达人','进入新区','https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/966dfa3099f3206c346af2020d00a8e3d0ecdef7476feae1d9428258235936dc.jpeg',4),
('神剑仙侠','进入新区','https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/2e5c534d646be780316a5a5b051ef1c09753ea1ba334da78a4ff57411980a1e4.jpeg',3),
('魅影传说','进入新区','https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/3319cdb0d6deced121814852f34ed205c39ea7a7cb4df140d74a610741209fa0.jpeg',2),
('龙破九天','进入新区','https://static.prod-images.emergentagent.com/jobs/8ceee47f-b40f-42cf-b30a-3c4bee582537/images/541342dc782ffbc770373fa41fc8ff39ed080d3a45b63cdeb6ed3ecace61ed30.jpeg',1);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 迁移备注
-- 1) Mongo `group` 字段 -> MySQL 用 `grp`(group 是保留字)。后端映射时记得改名。
-- 2) numbers/items/columns/odds/result_numbers 用 JSON,读写用 JSON_ARRAY / JSON_OBJECT
--    或直接存 JSON 字符串。
-- 3) rankings(牛人榜)、profit(盈利统计)后端是确定性生成,无需建表;
--    若要真实化,可新增 user_daily_stats 表统计每日投注/派奖后再排序。
-- 4) rounds_base 首次访问某彩种时由后端写入(锚定 base_period=最新期+1, base_ts=对齐 interval)。
-- 5) sign(签到)、messages(站内信)、hongbao(红包)当前在 /user 接口里是示例常量,
--    如需真实化请补 sign_log / messages / hongbao 三张表。
-- =============================================================================
