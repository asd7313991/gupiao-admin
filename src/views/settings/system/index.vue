<template>
  <div v-loading="loading" class="settings-page art-full-height">
    <ElCard shadow="never" class="page-header"
      ><div class="header-content"
        ><div><h2>系统设置</h2><p>统一管理交易参数、风控策略与应用服务配置</p></div
        ><div class="header-actions"
          ><ElTag :type="editing ? 'warning' : 'success'" effect="light">{{
            editing ? '编辑中' : '配置已生效'
          }}</ElTag
          ><ElButton type="primary" @click="editing ? save() : (editing = true)">{{
            editing ? '保存设置' : '编辑设置'
          }}</ElButton></div
        ></div
      ></ElCard
    >
    <ElCard shadow="never" class="panel branding-panel"
      ><template #header
        ><SectionTitle
          mark="◆"
          color="blue"
          title="移动端品牌"
          desc="设置登录与注册页面显示的产品名称和 Logo" /></template
      ><div class="branding-form"
        ><div class="branding-preview"
          ><div class="branding-logo"
            ><img v-if="logoPreview" :src="logoPreview" alt="当前产品 Logo" />
            <span v-else>LOGO</span></div
          ><strong>{{ setting.branding.productName || '证券行情' }}</strong></div
        ><div class="branding-fields"
          ><label
            ><span>产品名称</span
            ><ElInput
              v-model="setting.branding.productName"
              :disabled="!editing"
              maxlength="30"
              show-word-limit
              placeholder="证券行情" /></label
          ><label
            ><span>登录页 Logo</span
            ><div class="branding-upload-actions"
              ><ElUpload
                v-if="editing"
                accept="image/jpeg,image/png,image/webp"
                :show-file-list="false"
                :http-request="uploadLogo"
                ><ElButton :loading="uploading">{{
                  setting.branding.logo ? '替换 Logo' : '上传 Logo'
                }}</ElButton></ElUpload
              ><ElButton
                v-if="editing && setting.branding.logo"
                type="danger"
                plain
                @click="removeLogo"
                >移除</ElButton
              ><small>JPEG、PNG 或 WebP，不超过 2MB，建议使用正方形图片</small></div
            ></label
          ></div
        ></div
      ></ElCard
    >
    <ElCard shadow="never" class="panel trade"
      ><template #header
        ><SectionTitle
          mark="▣"
          color="blue"
          title="交易费率与交易时间"
          desc="设置不同市场的收费规则和交易时段" /></template
      ><ElAlert
        v-if="setting.trade.allDay"
        class="trade-test-alert"
        title="全天交易测试模式已开启"
        description="市价买卖和限价挂单撮合将忽略交易日与交易时段限制，仅用于测试，完成后请立即关闭。"
        type="warning"
        show-icon
        :closable="false" /><ElTabs class="market-tabs"
        ><ElTabPane label="A股"
          ><SettingsBlock
            :editing="editing"
            :data="setting.trade"
            :fields="tradeFields" /></ElTabPane
        ><ElTabPane label="港股"
          ><SettingsBlock
            :editing="editing"
            :data="setting.trade"
            :fields="tradeFields" /></ElTabPane></ElTabs
    ></ElCard>
    <div class="grid"
      ><ElCard shadow="never" class="panel"
        ><template #header
          ><SectionTitle
            mark="▣"
            color="green"
            title="杠杆和风控"
            desc="资金杠杆与强制平仓阈值" /></template
        ><SettingsBlock :editing="editing" :data="setting.risk" :fields="riskFields" /></ElCard
      ><ElCard shadow="never" class="panel"
        ><template #header
          ><SectionTitle
            mark="▣"
            color="red"
            title="充值提现"
            desc="充值档位、提现费用与限额" /></template
        ><SettingsBlock
          :editing="editing"
          :data="setting.recharge"
          :fields="rechargeFields" /></ElCard
      ><ElCard shadow="never" class="panel"
        ><template #header
          ><SectionTitle
            mark="◷"
            color="blue"
            title="证券行情同步"
            desc="交易时段与非交易时段自动同步公开行情数据" /></template
        ><SettingsBlock
          :editing="editing"
          :data="setting.stockSync"
          :fields="stockSyncFields" /></ElCard
      ><ElCard shadow="never" class="panel"
        ><template #header
          ><SectionTitle
            mark="▣"
            color="gray"
            title="买入涨幅限制"
            desc="不同板块买入限制与交易权限" /></template
        ><SettingsBlock :editing="editing" :data="setting.limits" :fields="limitFields" /></ElCard
      ><ElCard shadow="never" class="panel"
        ><template #header
          ><SectionTitle
            mark="⚙"
            color="blue"
            title="系统设置"
            desc="行情、客服与消息服务地址" /></template
        ><SettingsBlock :editing="editing" :data="setting.links" :fields="linkFields" /></ElCard
    ></div>
    <div v-if="editing" class="footer"
      ><ElButton @click="cancel">取消</ElButton
      ><ElButton type="primary" @click="save">保存设置</ElButton></div
    >
  </div>
</template>
<script setup lang="ts">
  import { defineComponent } from 'vue'
  import { ElMessage, type UploadRequestOptions } from 'element-plus'
  import {
    fetchAppSystemSetting,
    saveAppSystemSetting,
    uploadAppBrandLogo,
    type AppSystemSetting
  } from '@/api/system-manage'
  import SettingsBlock from './SettingsBlock.vue'
  defineOptions({ name: 'SettingsSystem' })
  const SectionTitle = defineComponent({
    props: { mark: String, color: String, title: String, desc: String },
    template:
      '<div class="section-title"><span class="section-mark" :class="color">{{ mark }}</span><div><h3>{{ title }}</h3><p>{{ desc }}</p></div></div>'
  })
  const defaultStockSync = {
    enabled: true,
    tradingIntervalSecs: 60,
    offHoursIntervalSecs: 600,
    maxSyncRows: 10000
  }
  const defaultBranding = { productName: '证券行情', logo: '' }
  const defaultRisk = {
    managementFeePerTenThousand: 2.8,
    marginCallStart: 16,
    marginCallRate: 0.005
  }
  const loading = ref(false),
    editing = ref(false),
    uploading = ref(false),
    localLogoPreview = ref(''),
    snapshot = ref(''),
    setting = reactive<AppSystemSetting>({
      branding: { ...defaultBranding },
      trade: {},
      stockSync: { ...defaultStockSync },
      risk: { ...defaultRisk },
      recharge: {},
      limits: {},
      links: {}
    })
  const logoPreview = computed(() => {
    if (localLogoPreview.value) return localLogoPreview.value
    return setting.branding.logo
      ? `/api/v1/open/mobile/branding/logo?v=${encodeURIComponent(setting.branding.logo)}`
      : ''
  })
  const fields = (data: [string, string, any][]) =>
    data.map(([key, label, type]) => ({ key, label, type }))
  const tradeFields = fields([
    ['buyCommission', '买入佣金费率', 'number'],
    ['sellCommission', '卖出佣金费率', 'number'],
    ['minCommission', '最小佣金', 'number'],
    ['stampDuty', '印花税费率', 'number'],
    ['transferFee', '过户费率', 'number'],
    ['morningStart', '早上开始时间', 'time'],
    ['morningEnd', '早上结束时间', 'time'],
    ['afternoonStart', '下午开始时间', 'time'],
    ['afternoonEnd', '下午结束时间', 'time'],
    ['allDay', '测试模式：强制开启全天交易', 'boolean'],
    ['nonTradingFee', '非交易日收费', 'boolean']
  ])
  const stockSyncFields = fields([
    ['enabled', '启用定时同步', 'boolean'],
    ['tradingIntervalSecs', '交易时段同步间隔（秒）', 'number'],
    ['offHoursIntervalSecs', '非交易时段同步间隔（秒）', 'number'],
    ['maxSyncRows', '单次最大同步条数', 'number']
  ])
  const riskFields = fields([
    ['defaultLeverage', '默认杠杆倍数', 'number'],
    ['forceCloseRatio', '强制平仓比例', 'number'],
    ['appLeverageEnabled', 'App可用资金是否乘杠杆倍数', 'boolean'],
    ['managementFeePerTenThousand', '每日持仓管理费（元/万元）', 'number'],
    ['marginCallStart', '风险补仓起始亏损（%）', 'number'],
    ['marginCallRate', '每跌1%补充市值比例', 'number']
  ])
  const rechargeFields = fields([
    ['minRecharge', '最小充值金额', 'number'],
    ['quickAmounts', '快捷充值档位', 'text'],
    ['minWithdraw', '最小提现金额', 'number'],
    ['withdrawFeeRate', '提现手续费率', 'number'],
    ['minWithdrawFee', '最小提现手续费', 'number'],
    ['dailyWithdrawLimit', '每日提现次数', 'number'],
    ['withdrawStart', '提现开始时间', 'time'],
    ['withdrawEnd', '提现结束时间', 'time'],
    ['sameDaySellWithdraw', '当天卖出的持仓金额需要次日才可以提现', 'boolean']
  ])
  const limitFields = fields([
    ['starBoard', '科创板买入限制', 'number'],
    ['beijingBoard', '北交所买入限制', 'number'],
    ['mainBoard', '主板买入限制', 'number'],
    ['growthBoard', '创业板买入限制', 'number'],
    ['minStarShares', '科创板最小买入股数', 'number'],
    ['stTrade', 'ST股票交易', 'boolean'],
    ['newStockTrade', '上市当日新股交易', 'boolean']
  ])
  const linkFields = fields([
    ['customerService', '在线客服链接', 'text'],
    ['hkdRate', '港币汇率', 'number'],
    ['aQuote', 'A股行情链接', 'text'],
    ['hkQuote', '港股行情链接', 'text'],
    ['telegramToken', 'Telegram 密钥', 'text'],
    ['telegramChatId', 'Telegram 群组 ID', 'text']
  ])
  const load = async () => {
    loading.value = true
    try {
      const data = await fetchAppSystemSetting()
      Object.assign(setting, data, {
        branding: { ...defaultBranding, ...data.branding },
        risk: {
          ...defaultRisk,
          ...data.risk,
          managementFeePerTenThousand:
            data.risk?.managementFeePerTenThousand ??
            Number(data.trade?.managementFee ?? 0.00028) * 10000
        },
        stockSync: { ...defaultStockSync, ...data.stockSync }
      })
      snapshot.value = JSON.stringify(setting)
    } finally {
      loading.value = false
    }
  }
  const save = async () => {
    await saveAppSystemSetting(setting)
    snapshot.value = JSON.stringify(setting)
    clearLocalLogoPreview()
    editing.value = false
    ElMessage.success('系统设置已保存')
  }
  const cancel = () => {
    Object.assign(setting, JSON.parse(snapshot.value))
    clearLocalLogoPreview()
    editing.value = false
  }
  const clearLocalLogoPreview = () => {
    if (localLogoPreview.value) URL.revokeObjectURL(localLogoPreview.value)
    localLogoPreview.value = ''
  }
  const uploadLogo = async (options: UploadRequestOptions) => {
    uploading.value = true
    try {
      const result = await uploadAppBrandLogo(options.file)
      clearLocalLogoPreview()
      localLogoPreview.value = URL.createObjectURL(options.file)
      setting.branding.logo = result.logo
      ElMessage.success('Logo 上传成功，请保存设置使其生效')
      return result
    } finally {
      uploading.value = false
    }
  }
  const removeLogo = () => {
    clearLocalLogoPreview()
    setting.branding.logo = ''
  }
  onBeforeUnmount(clearLocalLogoPreview)
  onMounted(load)
</script>
<style scoped>
  .settings-page {
    height: auto;
    min-height: var(--art-full-height);
    padding: 8px 0 28px;
    overflow: visible;
  }

  .page-header {
    flex: none;
    margin-bottom: 14px;
    overflow: visible;
    border-radius: 6px;
  }

  .page-header :deep(.el-card__body) {
    min-height: 82px;
    padding: 18px 20px;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 46px;
  }

  .header-content h2 {
    margin: 0;
    font-size: 18px;
    line-height: 1.35;
  }

  .header-content p,
  .section-title p {
    margin: 5px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .header-actions {
    display: flex;
    flex: none;
    gap: 12px;
    align-items: center;
  }

  .panel {
    border-radius: 6px;
  }

  .trade {
    margin-bottom: 14px;
  }

  .branding-panel {
    margin-bottom: 14px;
  }

  .branding-form {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 30px;
    align-items: center;
    padding: 18px;
  }

  .branding-preview {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    padding: 18px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
  }

  .branding-logo {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    overflow: hidden;
    font-size: 12px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-border-color-light);
    border-radius: 18px;
  }

  .branding-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .branding-fields {
    display: grid;
    gap: 18px;
  }

  .branding-fields label {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    font-size: 13px;
  }

  .branding-upload-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .branding-upload-actions small {
    width: 100%;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .trade-test-alert {
    margin: 0 18px 10px;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .market-tabs {
    padding: 0 18px;
  }

  .section-title {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .section-title h3 {
    margin: 0;
    font-size: 15px;
  }

  .section-mark {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 4px;
  }

  .blue {
    color: #409eff;
    background: #ecf5ff;
  }

  .green {
    color: #67c23a;
    background: #f0f9eb;
  }

  .red {
    color: #f56c6c;
    background: #fef0f0;
  }

  .gray {
    color: #909399;
    background: #f4f4f5;
  }

  .footer {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 14px 16px;
    margin-top: 14px;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgb(0 0 0 / 8%);
  }

  @media (width <= 900px) {
    .header-content {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .grid {
      grid-template-columns: 1fr;
    }

    .branding-form {
      grid-template-columns: 1fr;
    }
  }
</style>
