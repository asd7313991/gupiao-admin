<template>
  <div class="page art-full-height"
    ><ArtSearchBar
      v-model="filters"
      :items="searchItems"
      :show-expand="false"
      @search="search"
      @reset="reset"
    /><ElCard class="art-table-card"
      ><ArtTableHeader :loading="loading" @refresh="load"
        ><template #left
          ><ElButton @click="openEditor()">添加记录</ElButton></template
        ></ArtTableHeader
      ><ElTable v-loading="loading" :data="rows"
        ><ElTableColumn type="selection" width="42" /><ElTableColumn
          prop="id"
          label="ID"
          width="65"
        /><ElTableColumn label="姓名/手机号" min-width="130"
          ><template #default="{ row }"
            ><b>{{ row.customer_name }}</b
            ><small>{{ row.customer_phone }}</small></template
          ></ElTableColumn
        ><ElTableColumn label="证券代码" min-width="130"
          ><template #default="{ row }"
            ><b>{{ row.stock_name }}</b
            ><small class="profit">{{ row.symbol }}</small></template
          ></ElTableColumn
        ><ElTableColumn label="币种"
          ><template #default="{ row }">{{ currencyText(row.currency) }}</template></ElTableColumn
        ><ElTableColumn label="类型"
          ><template #default="{ row }"
            ><ElTag :type="row.direction === '买入' ? 'success' : 'danger'">{{
              row.direction
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn label="成交口径" width="125"
          ><template #default="{ row }"
            ><ElTag :type="row.quantity_basis === 1 ? 'success' : 'warning'">{{
              row.quantity_basis === 1 ? '实际股数' : '历史旧口径'
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn prop="trade_price" label="成交价格" /><ElTableColumn
          prop="quantity"
          label="数量"
        /><ElTableColumn label="成交额"
          ><template #default="{ row }"
            ><span class="profit">{{ money(row.amount, row.currency) }}</span></template
          ></ElTableColumn
        ><ElTableColumn prop="stamp_duty" label="印花税" /><ElTableColumn
          prop="transfer_fee"
          label="其他交易费"
        /><ElTableColumn prop="commission" label="佣金" /><ElTableColumn
          prop="remark"
          label="备注"
          min-width="140"
        /><ElTableColumn label="时间" min-width="160"
          ><template #default="{ row }">{{ time(row.trade_at) }}</template></ElTableColumn
        ><ElTableColumn label="操作" width="112" fixed="right"
          ><template #default="{ row }"
            ><div class="actions"
              ><ElButton text @click="openEditor(row)">编辑</ElButton>
              <ElButton
                v-if="!isHongKongRecord(row)"
                text
                type="warning"
                @click="openBasisEditor(row)"
                >修正口径</ElButton
              ><ElButton text type="danger" @click="remove(row)">删除</ElButton></div
            ></template
          ></ElTableColumn
        ></ElTable
      ><div class="pager"
        ><span>共 {{ total }} 条</span
        ><ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="prev, pager, next, sizes"
          @current-change="load"
          @size-change="load" /></div></ElCard
    ><ElDialog
      v-model="visible"
      :title="current?.id ? '编辑交易记录' : '添加交易记录'"
      width="700px"
      ><ElForm label-width="95px"
        ><ElRow :gutter="16"
          ><ElCol :span="12"
            ><ElFormItem label="客户ID"
              ><ElInputNumber v-model="form.customer_id" :min="1" /></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="交易方向"
              ><ElSelect v-model="form.direction"
                ><ElOption label="买入" value="买入" /><ElOption
                  label="卖出"
                  value="卖出" /></ElSelect></ElFormItem></ElCol></ElRow
        ><ElRow :gutter="16"
          ><ElCol :span="12"
            ><ElFormItem label="股票代码"><ElInput v-model="form.symbol" /></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="股票名称"
              ><ElInput v-model="form.stock_name" /></ElFormItem></ElCol></ElRow
        ><ElRow :gutter="16"
          ><ElCol :span="12"
            ><ElFormItem label="成交价格"
              ><ElInputNumber
                v-model="form.trade_price"
                :min="0"
                :precision="4" /></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="数量"
              ><ElInputNumber v-model="form.quantity" :min="0" /></ElFormItem></ElCol></ElRow
        ><ElRow :gutter="16"
          ><ElCol :span="8"
            ><ElFormItem label="印花税"
              ><ElInputNumber
                v-model="form.stamp_duty"
                :min="0"
                :precision="2" /></ElFormItem></ElCol
          ><ElCol :span="8"
            ><ElFormItem label="过户费"
              ><ElInputNumber
                v-model="form.transfer_fee"
                :min="0"
                :precision="2" /></ElFormItem></ElCol
          ><ElCol :span="8"
            ><ElFormItem label="佣金"
              ><ElInputNumber
                v-model="form.commission"
                :min="0"
                :precision="2" /></ElFormItem></ElCol></ElRow
        ><ElFormItem label="备注"><ElInput v-model="form.remark" /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="visible = false">取消</ElButton
        ><ElButton type="primary" @click="save">确定</ElButton></template
      ></ElDialog
    ><ElDialog v-model="basisVisible" title="修正成交口径" width="520px"
      ><p class="basis-warning">
        仅修改这条A股成交记录的口径，不会调整成交价、股数、费用、已实现盈亏、余额或持仓。请依据原始成交信息核实后操作。
      </p>
      <ElForm label-width="95px">
        <ElFormItem label="成交记录">
          <span v-if="basisRecord"
            >#{{ basisRecord.id }} · {{ basisRecord.stock_name }}（{{ basisRecord.symbol }}）·
            {{ basisRecord.direction }}</span
          >
        </ElFormItem>
        <ElFormItem label="当前口径">
          <ElTag
            v-if="basisRecord"
            :type="basisRecord.quantity_basis === 1 ? 'success' : 'warning'"
          >
            {{ basisRecord.quantity_basis === 1 ? '实际股数' : '历史旧口径' }}
          </ElTag>
        </ElFormItem>
        <ElFormItem label="修正为">
          <ElSelect v-model="basisForm.quantity_basis">
            <ElOption label="实际股数" :value="1" />
            <ElOption label="历史旧口径" :value="0" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="修正原因">
          <ElInput
            v-model="basisForm.reason"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="填写核对依据，例如原始成交单或后台审核记录"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="basisVisible = false">取消</ElButton>
        <ElButton type="warning" :disabled="!basisForm.reason.trim()" @click="saveBasisAdjustment"
          >确认修正</ElButton
        >
      </template>
    </ElDialog></div
  >
</template>
<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    deleteTradeRecord,
    adjustTradeRecordBasis,
    fetchTradeRecords,
    saveTradeRecord,
    type TradeRecord
  } from '@/api/system-manage'
  defineOptions({ name: 'TradeRecord' })
  const loading = ref(false),
    rows = ref<TradeRecord[]>([]),
    total = ref(0),
    page = ref(1),
    pageSize = ref(20),
    filters = reactive({ phone: '', symbol: '', direction: '' })
  const searchItems = [
    { label: '手机号', key: 'phone', type: 'input', props: { placeholder: '请输入手机号' } },
    { label: '完整代码', key: 'symbol', type: 'input', props: { placeholder: '请输入完整代码' } },
    {
      label: '交易方向',
      key: 'direction',
      type: 'select',
      props: {
        placeholder: '请选择交易方向',
        options: [
          { label: '买入', value: '买入' },
          { label: '卖出', value: '卖出' }
        ]
      }
    }
  ]
  const load = async () => {
    loading.value = true
    try {
      const data = await fetchTradeRecords({
        page: page.value,
        pageSize: pageSize.value,
        ...filters
      })
      rows.value = data.records
      total.value = data.total
    } finally {
      loading.value = false
    }
  }
  const search = () => {
    page.value = 1
    load()
  }
  const reset = () => {
    Object.assign(filters, { phone: '', symbol: '', direction: '' })
    page.value = 1
    load()
  }
  const money = (v: number, currency = 'CNY') =>
      `${currency === 'HKD' ? 'HK$' : '¥'}${v.toFixed(2)}`,
    currencyText = (currency: string) =>
      currency === 'CNY' ? '人民币' : currency === 'HKD' ? '港币' : currency || '--',
    time = (v: number) => new Date(v * 1000).toLocaleString('zh-CN', { hour12: false })
  const isHongKongRecord = (row: TradeRecord) =>
    row.currency === 'HKD' || row.symbol.toUpperCase().endsWith('.HK')
  const empty = () => ({
    customer_id: 1,
    symbol: '',
    stock_name: '',
    currency: 'CNY',
    direction: '买入' as const,
    trade_price: 0,
    quantity: 0,
    stamp_duty: 0,
    transfer_fee: 0,
    commission: 0,
    remark: ''
  })
  const visible = ref(false),
    current = ref<TradeRecord | null>(null),
    form = reactive(empty())
  const basisVisible = ref(false),
    basisRecord = ref<TradeRecord | null>(null),
    basisForm = reactive({ quantity_basis: 1, reason: '' })
  const openBasisEditor = (row: TradeRecord) => {
    basisRecord.value = row
    basisForm.quantity_basis = row.quantity_basis === 1 ? 0 : 1
    basisForm.reason = ''
    basisVisible.value = true
  }
  const saveBasisAdjustment = async () => {
    if (!basisRecord.value || !basisForm.reason.trim()) {
      return ElMessage.warning('请先选择成交记录并填写修正原因')
    }
    if (basisForm.quantity_basis === basisRecord.value.quantity_basis) {
      return ElMessage.warning('修正后的口径与当前口径相同')
    }
    await adjustTradeRecordBasis({
      id: basisRecord.value.id,
      quantity_basis: basisForm.quantity_basis,
      reason: basisForm.reason.trim()
    })
    ElMessage.success('成交口径已修正并记录审计')
    basisVisible.value = false
    await load()
  }
  const openEditor = (row?: TradeRecord) => {
    current.value = row || null
    Object.assign(form, row ? { ...empty(), ...row } : empty())
    visible.value = true
  }
  const save = async () => {
    if (!form.symbol) return ElMessage.warning('请输入证券代码')
    await saveTradeRecord({ ...form, id: current.value?.id })
    ElMessage.success('交易记录已保存')
    visible.value = false
    load()
  }
  const remove = async (row: TradeRecord) => {
    await ElMessageBox.confirm(
      `确定删除 ${row.stock_name}（${row.symbol}）这条交易记录吗？仅从记录列表移除，不会撤销交易或调整资金、持仓。`,
      '删除交易记录',
      { type: 'warning' }
    )
    await deleteTradeRecord(row.id)
    ElMessage.success('交易记录已删除')
    if (rows.value.length === 1 && page.value > 1) page.value -= 1
    await load()
  }
  onMounted(load)
</script>
<style scoped>
  .page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  .art-table-card {
    flex: 1;
    min-height: 0;
  }

  .art-table-card :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .art-table-card :deep(.el-table) {
    flex: 1;
    min-height: 0;
  }

  .pager {
    display: flex;
    flex: none;
    gap: 14px;
    align-items: center;
    justify-content: flex-end;
    padding-top: 14px;
  }

  small {
    display: block;
    color: var(--el-text-color-secondary);
  }

  .basis-warning {
    margin: 0 0 18px;
    line-height: 1.6;
    color: var(--el-color-warning-dark-2);
  }

  .profit {
    color: var(--el-color-success);
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.el-input-number),
  :deep(.el-select) {
    width: 100%;
  }
</style>
