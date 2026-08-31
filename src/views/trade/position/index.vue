<template>
  <div class="page art-full-height">
    <ArtSearchBar
      v-model="filters"
      :items="searchItems"
      :show-expand="false"
      @search="load"
      @reset="reset"
    />
    <ElCard class="art-table-card"
      ><ArtTableHeader :loading="loading" @refresh="load"
        ><template #left
          ><ElButton @click="openEditor()">添加持仓</ElButton></template
        ></ArtTableHeader
      >
      <ElTable v-loading="loading" :data="rows"
        ><ElTableColumn type="selection" width="42" /><ElTableColumn
          prop="id"
          label="ID"
          width="70" /><ElTableColumn prop="customer_id" label="用户ID" /><ElTableColumn
          label="证券代码"
          min-width="145"
          ><template #default="{ row }"
            ><b>{{ row.stock_name }}</b
            ><small class="profit">{{ row.symbol }}</small></template
          ></ElTableColumn
        ><ElTableColumn prop="currency" label="币种" /><ElTableColumn
          label="市值/担保金"
          min-width="125"
          ><template #default="{ row }"
            >{{ money(row.market_value) }}<small>{{ money(row.margin) }}</small></template
          ></ElTableColumn
        ><ElTableColumn label="杠杆"
          ><template #default="{ row }">{{ row.leverage.toFixed(2) }}倍</template></ElTableColumn
        ><ElTableColumn label="持仓/可用"
          ><template #default="{ row }"
            >{{ row.position_qty }}<small>{{ row.available_qty }}</small></template
          ></ElTableColumn
        ><ElTableColumn label="现价/成本"
          ><template #default="{ row }"
            ><span :class="row.profit_loss >= 0 ? 'profit' : 'loss'">{{
              row.current_price.toFixed(2)
            }}</span
            ><small>{{ row.cost_price.toFixed(2) }}</small></template
          ></ElTableColumn
        ><ElTableColumn label="盈亏"
          ><template #default="{ row }"
            ><span :class="row.profit_loss >= 0 ? 'profit' : 'loss'">{{
              money(row.profit_loss)
            }}</span
            ><small :class="row.profit_loss >= 0 ? 'profit' : 'loss'"
              >{{ row.profit_rate.toFixed(2) }}%</small
            ></template
          ></ElTableColumn
        ><ElTableColumn label="状态"
          ><template #default="{ row }"
            ><ElTag :type="row.status === 1 ? 'success' : 'danger'">{{
              row.status === 1 ? '持有' : '已关闭'
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn label="买入日期" min-width="160"
          ><template #default="{ row }">{{ time(row.buy_at) }}</template></ElTableColumn
        ><ElTableColumn label="操作" width="112" fixed="right"
          ><template #default="{ row }"
            ><div class="action-buttons"
              ><ElTooltip content="编辑持仓"
                ><ElButton text class="icon-button" @click="openEditor(row)"
                  ><ElIcon><EditPen /></ElIcon></ElButton></ElTooltip
              ><ElTooltip content="删除持仓"
                ><ElButton text class="icon-button danger" @click="remove(row)"
                  ><ElIcon
                    ><Delete /></ElIcon></ElButton></ElTooltip></div></template></ElTableColumn
      ></ElTable>
    </ElCard>
    <ElDialog v-model="visible" :title="current?.id ? '编辑持仓' : '添加持仓'" width="680px"
      ><ElForm label-width="105px"
        ><ElFormItem label="用户ID" v-if="!current"
          ><ElInputNumber v-model="form.customer_id" :min="1" /></ElFormItem
        ><ElFormItem label="股票代码"
          ><ElInput
            v-model="form.symbol"
            :disabled="!!current"
            placeholder="如 600726.SH" /></ElFormItem
        ><ElFormItem label="股票名称"
          ><ElInput v-model="form.stock_name" :disabled="!!current" /></ElFormItem
        ><ElRow :gutter="16"
          ><ElCol :span="12"
            ><ElFormItem label="持仓均价" required
              ><ElInputNumber
                v-model="form.cost_price"
                :min="0"
                :precision="4"
                :step="0.01" /></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="持仓数量" required
              ><ElInputNumber
                v-model="form.position_qty"
                :min="0"
                :precision="0" /></ElFormItem></ElCol></ElRow
        ><ElRow :gutter="16"
          ><ElCol :span="12"
            ><ElFormItem label="可用数量"
              ><ElInputNumber
                v-model="form.available_qty"
                :min="0"
                :precision="0" /></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="杠杆倍数"
              ><ElInputNumber
                v-model="form.leverage"
                :min="1"
                :max="20"
                :precision="2" /></ElFormItem></ElCol></ElRow
        ><ElFormItem label="当前价格" v-if="!current"
          ><ElInputNumber v-model="form.current_price" :min="0" :precision="4" /></ElFormItem
        ><ElFormItem label="仓位变动记录" v-if="current"
          ><ElRadioGroup v-model="form.record_change"
            ><ElRadio :value="true">记录</ElRadio
            ><ElRadio :value="false">不记录</ElRadio></ElRadioGroup
          ><p class="tip"
            >选择“记录”会保留本次仓位调整的审计信息；“不记录”仅修改持仓与资金。</p
          ></ElFormItem
        ><ElFormItem label="创建时间" v-if="current"
          ><ElInput :model-value="time(current.buy_at)" disabled /></ElFormItem
        ><ElFormItem label="修改时间" v-if="current"
          ><ElInput :model-value="now" disabled /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="visible = false">取消</ElButton
        ><ElButton type="primary" @click="save">确定</ElButton></template
      ></ElDialog
    >
  </div>
</template>
<script setup lang="ts">
  import { Delete, EditPen } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    deleteTradePosition,
    fetchTradePositions,
    saveTradePosition,
    type TradePosition
  } from '@/api/system-manage'
  defineOptions({ name: 'TradePosition' })
  const loading = ref(false),
    rows = ref<TradePosition[]>([]),
    filters = reactive({
      phone: '',
      symbol: '',
      stock_name: '',
      status: undefined as number | undefined
    })
  const searchItems = [
    { label: '手机号', key: 'phone', type: 'input', props: { placeholder: '请输入手机号' } },
    { label: '完整代码', key: 'symbol', type: 'input', props: { placeholder: '请输入完整代码' } },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '全部',
        options: [
          { label: '持有', value: 1 },
          { label: '已关闭', value: 2 }
        ]
      }
    },
    {
      label: '股票名称',
      key: 'stock_name',
      type: 'input',
      props: { placeholder: '请输入股票名称' }
    }
  ]
  const load = async () => {
    loading.value = true
    try {
      rows.value = await fetchTradePositions(filters)
    } finally {
      loading.value = false
    }
  }
  const reset = () => {
    Object.assign(filters, { phone: '', symbol: '', stock_name: '', status: undefined })
    load()
  }
  const money = (v: number) => `¥${v.toFixed(2)}`,
    time = (v: number) => new Date(v * 1000).toLocaleString('zh-CN', { hour12: false })
  const empty = () => ({
    customer_id: 1,
    symbol: '',
    stock_name: '',
    currency: 'CNY',
    position_qty: 0,
    available_qty: 0,
    current_price: 0,
    cost_price: 0,
    leverage: 5,
    record_change: false
  })
  const visible = ref(false),
    current = ref<TradePosition | null>(null),
    form = reactive(empty()),
    now = ref('')
  const openEditor = (row?: TradePosition) => {
    current.value = row || null
    Object.assign(form, row ? { ...empty(), ...row } : empty())
    now.value = new Date().toLocaleString('zh-CN', { hour12: false })
    visible.value = true
  }
  const save = async () => {
    if (!form.symbol) return ElMessage.warning('请输入证券代码')
    if (form.available_qty > form.position_qty) return ElMessage.warning('可用数量不能大于持仓数量')
    await saveTradePosition({ ...form, id: current.value?.id })
    ElMessage.success('持仓已保存')
    visible.value = false
    load()
  }
  const remove = async (row: TradePosition) => {
    await ElMessageBox.confirm(`确定删除 ${row.symbol} 持仓吗？`, '删除持仓', { type: 'warning' })
    await deleteTradePosition(row.id)
    ElMessage.success('持仓已删除')
    load()
  }
  onMounted(load)
</script>
<style scoped>
  .page {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .art-table-card {
    flex: 1;
  }

  small {
    display: block;
    color: var(--el-text-color-secondary);
  }

  .profit {
    color: var(--el-color-danger);
  }

  .loss {
    color: var(--el-color-success);
  }

  .danger {
    color: var(--el-color-danger);
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    white-space: nowrap;
  }

  .icon-button {
    flex: 0 0 28px;
    min-width: 28px;
    margin: 0;
    font-size: 16px;
  }

  .tip {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  :deep(.el-input-number) {
    width: 100%;
  }
</style>
