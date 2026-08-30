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
        ><ElTableColumn prop="currency" label="币种" /><ElTableColumn label="类型"
          ><template #default="{ row }"
            ><ElTag :type="row.direction === '买入' ? 'success' : 'danger'">{{
              row.direction
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn prop="trade_price" label="成交价格" /><ElTableColumn
          prop="quantity"
          label="数量"
        /><ElTableColumn label="成交额"
          ><template #default="{ row }"
            ><span class="profit">{{ money(row.amount) }}</span></template
          ></ElTableColumn
        ><ElTableColumn prop="stamp_duty" label="印花税" /><ElTableColumn
          prop="transfer_fee"
          label="过户费"
        /><ElTableColumn prop="commission" label="佣金" /><ElTableColumn
          prop="remark"
          label="备注"
          min-width="140"
        /><ElTableColumn label="时间" min-width="160"
          ><template #default="{ row }">{{ time(row.trade_at) }}</template></ElTableColumn
        ><ElTableColumn label="操作" width="76" fixed="right"
          ><template #default="{ row }"
            ><ElButton text @click="openEditor(row)">编辑</ElButton></template
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
    ></div
  >
</template>
<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchTradeRecords, saveTradeRecord, type TradeRecord } from '@/api/system-manage'
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
  const money = (v: number) => `¥${v.toFixed(2)}`,
    time = (v: number) => new Date(v * 1000).toLocaleString('zh-CN', { hour12: false })
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
    color: var(--el-color-success);
  }

  .pager {
    display: flex;
    gap: 14px;
    align-items: center;
    justify-content: flex-end;
    padding-top: 14px;
  }

  :deep(.el-input-number),
  :deep(.el-select) {
    width: 100%;
  }
</style>
