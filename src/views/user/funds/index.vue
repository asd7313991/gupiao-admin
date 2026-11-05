<template>
  <div class="funds-page art-full-height">
    <ArtSearchBar
      v-model="filters"
      :items="searchItems"
      :show-expand="false"
      @search="search"
      @reset="reset"
    />
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="loading" @refresh="load" />
      <ElAlert v-if="loadError" :title="loadError" type="error" :closable="false" show-icon />
      <div class="table-wrap">
        <ElTable ref="tableRef" v-loading="loading" :data="pageRows" row-key="id" height="100%">
          <ElTableColumn type="index" :index="rowIndex" label="序号" width="65" />
          <ElTableColumn prop="id" label="流水ID" width="90" />
          <ElTableColumn prop="customer_id" label="用户ID" width="90" />
          <ElTableColumn prop="type" label="资金类型" min-width="120" />
          <ElTableColumn label="方向" width="90">
            <template #default="{ row }">
              <ElTag :type="directionType(row)">{{ row.direction || '未记录' }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="remark" label="说明" min-width="280">
            <template #default="{ row }"
              ><span class="remark">{{ row.remark || '无' }}</span></template
            >
          </ElTableColumn>
          <ElTableColumn label="变动金额" min-width="125" align="right">
            <template #default="{ row }">
              <span :class="amountClass(row)">{{ signedAmount(row) }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="变动后余额" min-width="130" align="right">
            <template #default="{ row }">{{ row.balance.toFixed(2) }}</template>
          </ElTableColumn>
          <ElTableColumn prop="currency" label="币种" width="80" />
          <ElTableColumn label="创建时间（北京时间）" min-width="190">
            <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="80" fixed="right">
            <template #default="{ row }"
              ><ElButton text @click="view(row)">查看</ElButton></template
            >
          </ElTableColumn>
        </ElTable>
      </div>
      <div class="pager">
        <span>共 {{ rows.length }} 条</span>
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="rows.length"
          :disabled="loading"
          :pager-count="5"
          layout="prev, pager, next, sizes"
          @size-change="resize"
        />
      </div>
      <p class="fund-note">金额正负号按收支方向展示；仅供核账查看，不修改原始资金记录。</p>
    </ElCard>
    <ElDialog v-model="visible" title="资金流水详情" width="min(600px, calc(100% - 24px))">
      <ElDescriptions v-if="detail" :column="1" border>
        <ElDescriptionsItem label="流水ID">{{ detail.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="用户ID">{{ detail.customer_id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="资金类型">{{ detail.type || '未记录' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="方向">
          <ElTag :type="directionType(detail)">{{ detail.direction || '未记录' }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="说明"
          ><span class="remark">{{ detail.remark || '无' }}</span></ElDescriptionsItem
        >
        <ElDescriptionsItem label="变动金额">
          <span :class="amountClass(detail)">{{ signedAmount(detail) }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="原始记录金额">{{ detail.amount.toFixed(2) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="变动后余额">{{ detail.balance.toFixed(2) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="币种">{{ detail.currency }}</ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间（北京时间）">{{
          formatTime(detail.created_at)
        }}</ElDescriptionsItem>
      </ElDescriptions>
      <p class="fund-note">历史扣款金额可能原存为正数；上方按方向显示正负号，原始金额保持不变。</p>
      <template #footer><ElButton @click="visible = false">关闭</ElButton></template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { TableInstance } from 'element-plus'
  import { fetchCustomerFundRecords, type CustomerFundRecord } from '@/api/system-manage'

  defineOptions({ name: 'UserFunds' })
  const loading = ref(false)
  const rows = ref<CustomerFundRecord[]>([])
  const page = ref(1)
  const pageSize = ref(20)
  const filters = reactive({ phone: '' })
  const visible = ref(false)
  const detail = ref<CustomerFundRecord | null>(null)
  const loadError = ref('')
  const tableRef = ref<TableInstance>()
  const searchItems = [
    {
      label: '手机号',
      key: 'phone',
      type: 'input',
      props: { placeholder: '请输入手机号，不填查询全部用户流水' }
    }
  ]
  const pageRows = computed(() =>
    rows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
  )
  const rowIndex = (index: number) => (page.value - 1) * pageSize.value + index + 1
  let latestRequest = 0
  const load = async () => {
    const request = ++latestRequest
    loading.value = true
    loadError.value = ''
    try {
      const data = await fetchCustomerFundRecords(filters.phone.trim())
      if (request !== latestRequest) return
      rows.value = data
      page.value = Math.min(page.value, Math.max(1, Math.ceil(data.length / pageSize.value)))
    } catch (error) {
      if (request !== latestRequest) return
      rows.value = []
      page.value = 1
      loadError.value =
        error instanceof Error ? error.message : '资金流水加载失败，请重新查询或刷新'
    } finally {
      if (request === latestRequest) loading.value = false
    }
  }
  const search = () => {
    page.value = 1
    visible.value = false
    detail.value = null
    load()
  }
  const reset = () => {
    filters.phone = ''
    search()
  }
  const resize = () => {
    page.value = 1
  }
  watch([page, pageSize], async () => {
    await nextTick()
    tableRef.value?.setScrollTop(0)
  })
  const view = (row: CustomerFundRecord) => {
    detail.value = row
    visible.value = true
  }
  const amountClass = (row: CustomerFundRecord) =>
    row.direction === '入账'
      ? 'in'
      : row.direction === '扣款' || row.direction === '出账'
        ? 'out'
        : ''
  const directionType = (row: CustomerFundRecord) =>
    amountClass(row) === 'in' ? 'success' : amountClass(row) === 'out' ? 'danger' : 'warning'
  const signedAmount = (row: CustomerFundRecord) => {
    const direction = amountClass(row)
    if (!direction) return row.amount.toFixed(2)
    return `${direction === 'in' ? '+' : '-'}${Math.abs(row.amount).toFixed(2)}`
  }
  const formatTime = (value: CustomerFundRecord['created_at']) => {
    if (!value) return '未记录'
    const numeric =
      typeof value === 'number' || /^\d+(\.\d+)?$/.test(value) ? Number(value) : undefined
    const date =
      numeric !== undefined
        ? new Date(numeric < 1_000_000_000_000 ? numeric * 1000 : numeric)
        : new Date(value)
    if (Number.isNaN(date.getTime())) return `时间无效（${value}）`
    return date.toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
  }
  onMounted(load)
</script>

<style scoped>
  .funds-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    min-height: 0;
  }

  .art-table-card {
    flex: 1;
    min-height: 0;
    margin-top: 0;
  }

  .art-table-card :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .table-wrap {
    flex: 1;
    min-height: 0;
  }

  .pager {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: flex-end;
    padding-top: 14px;
  }

  .fund-note {
    flex: none;
    margin: 10px 0 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .remark {
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .in {
    color: var(--el-color-success);
  }

  .out {
    color: var(--el-color-danger);
  }

  :deep(.el-dialog__body) {
    max-height: 65vh;
    overflow-y: auto;
  }

  @media (width <= 640px) {
    .table-wrap {
      flex: none;
      height: 55vh;
      min-height: 240px;
    }

    .pager {
      justify-content: center;
    }

    :deep(.el-pagination) {
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }
  }
</style>
