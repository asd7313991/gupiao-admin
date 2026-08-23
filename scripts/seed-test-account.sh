#!/usr/bin/env bash
set -Eeuo pipefail

ADMIN_DIR="${ADMIN_DIR:-/www/wwwroot/gupiao-admin}"
PHONE="${PHONE:-13800138001}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-server}"
SEED_MARK="BAOTA_TEST_SEED_V1"
POSITION_MARK=946684800

log() { printf '\033[1;34m[%s]\033[0m %s\n' "$(date '+%F %T')" "$*"; }
fail() { printf '\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || fail "未安装 docker"
[[ -f "$ADMIN_DIR/compose.yaml" ]] || fail "找不到 compose.yaml：$ADMIN_DIR"
[[ "$PHONE" =~ ^1[0-9]{10}$ ]] || fail "手机号格式错误：$PHONE"

if [[ "${CONFIRM_SEED:-}" != "$PHONE" ]]; then
  cat <<EOF
即将为线上账号 $PHONE 重建测试数据，包括：
- 账户余额、策略余额、冻结资金、累计盈利和累计亏损
- 4 条持仓（包含盈利和亏损）
- 12 条买入/卖出成交记录
- 4 条资金流水

该账号现有的账户汇总数值会被设置为测试值。
脚本只删除带标记 $SEED_MARK 的旧测试流水，以及 buy_at=$POSITION_MARK 的旧测试持仓。

确认执行请使用：
  CONFIRM_SEED=$PHONE bash scripts/seed-test-account.sh
EOF
  exit 2
fi

cd "$ADMIN_DIR"
docker compose ps "$POSTGRES_SERVICE" >/dev/null 2>&1 || fail "PostgreSQL 容器未运行"

CUSTOMER_ID="$(docker compose exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "SELECT id FROM customers WHERE phone = '$PHONE' AND deleted_at IS NULL LIMIT 1")"
CUSTOMER_ID="$(printf '%s' "$CUSTOMER_ID" | tr -d '[:space:]')"
[[ "$CUSTOMER_ID" =~ ^[0-9]+$ ]] || fail "手机号 $PHONE 对应的客户不存在"

log "为手机号 $PHONE（客户 ID：$CUSTOMER_ID）生成测试数据"
docker compose exec -T "$POSTGRES_SERVICE" \
  psql -v ON_ERROR_STOP=1 -v customer_id="$CUSTOMER_ID" -v seed_mark="$SEED_MARK" -v position_mark="$POSITION_MARK" \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
BEGIN;

DELETE FROM trade_records
WHERE customer_id = :'customer_id'::bigint
  AND remark LIKE :'seed_mark' || '%';

DELETE FROM customer_fund_records
WHERE customer_id = :'customer_id'::bigint
  AND remark LIKE :'seed_mark' || '%';

DELETE FROM trade_positions
WHERE customer_id = :'customer_id'::bigint
  AND buy_at = :'position_mark'::bigint;

UPDATE customers
SET balance = 528640.75,
    strategy_balance = 180000.00,
    frozen_balance = 25680.00,
    total_profit = 86450.35,
    total_loss = 21380.60,
    status = 1,
    fund_status = 1,
    verified = 1,
    group_name = '测试用户',
    remark = CASE
      WHEN COALESCE(remark, '') LIKE '%' || :'seed_mark' || '%' THEN remark
      WHEN COALESCE(remark, '') = '' THEN :'seed_mark'
      ELSE remark || ' | ' || :'seed_mark'
    END,
    updated_at = NOW()
WHERE id = :'customer_id'::bigint;

WITH requested(symbol, fallback_name, qty, available, cost_price, fallback_price) AS (
  VALUES
    ('600000.SH', '浦发银行', 3200::numeric, 2800::numeric, 8.42::numeric, 9.11::numeric),
    ('000001.SZ', '平安银行', 5000::numeric, 5000::numeric, 10.68::numeric, 11.25::numeric),
    ('300750.SZ', '宁德时代', 600::numeric, 500::numeric, 248.60::numeric, 261.35::numeric),
    ('600519.SH', '贵州茅台', 200::numeric, 200::numeric, 1538.00::numeric, 1496.50::numeric)
), quotes AS (
  SELECT r.*,
         COALESCE(NULLIF(s.name, ''), r.fallback_name) AS stock_name,
         COALESCE(NULLIF(s.last_price, 0), r.fallback_price) AS current_price
  FROM requested r
  LEFT JOIN stock_securities s ON s.symbol = r.symbol AND s.deleted_at IS NULL
)
INSERT INTO trade_positions (
  created_at, updated_at, customer_id, symbol, stock_name, currency,
  position_qty, available_qty, current_price, cost_price, total_cost,
  market_value, profit_loss, profit_rate, status, buy_at
)
SELECT NOW(), NOW(), :'customer_id'::bigint, symbol, stock_name, 'CNY',
       qty, available, current_price, cost_price,
       ROUND(qty * cost_price, 2),
       ROUND(qty * current_price, 2),
       ROUND(qty * (current_price - cost_price), 2),
       ROUND((current_price - cost_price) / cost_price * 100, 4),
       1, :'position_mark'::bigint
FROM quotes;

WITH trades(symbol, stock_name, direction, price, qty, days_ago) AS (
  VALUES
    ('600000.SH','浦发银行','买入',8.18::numeric,2000::numeric,60),
    ('600000.SH','浦发银行','买入',8.80::numeric,1200::numeric,35),
    ('600000.SH','浦发银行','卖出',9.05::numeric,800::numeric,5),
    ('000001.SZ','平安银行','买入',10.20::numeric,3000::numeric,55),
    ('000001.SZ','平安银行','买入',11.40::numeric,2000::numeric,28),
    ('000001.SZ','平安银行','卖出',11.32::numeric,1000::numeric,9),
    ('300750.SZ','宁德时代','买入',239.50::numeric,400::numeric,48),
    ('300750.SZ','宁德时代','买入',266.80::numeric,200::numeric,18),
    ('300750.SZ','宁德时代','卖出',274.20::numeric,100::numeric,3),
    ('600519.SH','贵州茅台','买入',1588.00::numeric,100::numeric,72),
    ('600519.SH','贵州茅台','买入',1488.00::numeric,100::numeric,22),
    ('600519.SH','贵州茅台','卖出',1512.00::numeric,100::numeric,7)
), calculated AS (
  SELECT *, ROUND(price * qty, 2) AS trade_amount
  FROM trades
)
INSERT INTO trade_records (
  created_at, updated_at, customer_id, symbol, stock_name, currency, direction,
  trade_price, quantity, amount, stamp_duty, transfer_fee, commission, remark, trade_at
)
SELECT NOW() - make_interval(days => days_ago), NOW() - make_interval(days => days_ago),
      :'customer_id'::bigint, symbol, stock_name, 'CNY', direction,
       price, qty, trade_amount,
       CASE WHEN direction = '卖出' THEN ROUND(trade_amount * 0.0005, 2) ELSE 0 END,
       ROUND(trade_amount * 0.0001, 2),
       GREATEST(5, ROUND(trade_amount * 0.0003, 2)),
       :'seed_mark' || ' 模拟' || direction,
       EXTRACT(EPOCH FROM (NOW() - make_interval(days => days_ago)))::bigint
FROM calculated;

INSERT INTO customer_fund_records (
  created_at, updated_at, customer_id, type, direction, currency, amount, balance, remark
) VALUES
  (NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', :'customer_id'::bigint, '资金存入', '入账', 'CNY', 300000.00, 300000.00, :'seed_mark' || ' 初始入金'),
  (NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', :'customer_id'::bigint, '资金存入', '入账', 'CNY', 250000.00, 550000.00, :'seed_mark' || ' 追加资金'),
  (NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', :'customer_id'::bigint, '盈利结算', '入账', 'CNY', 18450.35, 568450.35, :'seed_mark' || ' 收益结算'),
  (NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', :'customer_id'::bigint, '资金转出', '出账', 'CNY', 39809.60, 528640.75, :'seed_mark' || ' 模拟提现');

COMMIT;

SELECT '客户' AS item, id::text AS value
FROM customers WHERE id = :'customer_id'::bigint
UNION ALL
SELECT '可用余额', TO_CHAR(balance, 'FM9999999990.00')
FROM customers WHERE id = :'customer_id'::bigint
UNION ALL
SELECT '测试持仓数', COUNT(*)::text
FROM trade_positions WHERE customer_id = :'customer_id'::bigint AND buy_at = :'position_mark'::bigint
UNION ALL
SELECT '测试成交数', COUNT(*)::text
FROM trade_records WHERE customer_id = :'customer_id'::bigint AND remark LIKE :'seed_mark' || '%'
UNION ALL
SELECT '测试流水数', COUNT(*)::text
FROM customer_fund_records WHERE customer_id = :'customer_id'::bigint AND remark LIKE :'seed_mark' || '%';
SQL

log "测试数据生成完成"
log "手机号：$PHONE"
log "再次执行会先清理该脚本上次生成的数据，不会无限叠加"
