<template>
  <div class="finance-page art-full-height">
    <ArtSearchBar
      v-model="filters"
      :items="searchItems"
      :show-expand="false"
      @search="search"
      @reset="reset"
    />
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="loading" @refresh="load">
        <template #left><ElButton @click="openEditor()">添加提现记录</ElButton></template>
      </ArtTableHeader>
      <div class="table-wrap">
        <ElTable v-loading="loading" :data="rows" height="100%">
          <ElTableColumn type="selection" width="42" />
          <ElTableColumn prop="id" label="ID" width="70" />
          <ElTableColumn prop="customer_phone" label="手机号" />
          <ElTableColumn prop="customer_name" label="姓名" />
          <ElTableColumn label="提现金额">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </ElTableColumn>
          <ElTableColumn label="币种">
            <template #default="{ row }">{{ currencyText(row.currency) }}</template>
          </ElTableColumn>
          <ElTableColumn prop="method" label="提现方式" />
          <ElTableColumn prop="bank_name" label="开户行" />
          <ElTableColumn prop="bank_card" label="银行卡号" min-width="160" />
          <ElTableColumn prop="bank_address" label="地址" min-width="130" />
          <ElTableColumn label="状态">
            <template #default="{ row }">
              <ElTag :type="statusType(row.status)">{{ statusText(row.status) }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="创建时间" min-width="165">
            <template #default="{ row }">{{ time(row.created_at) }}</template>
          </ElTableColumn>
          <ElTableColumn label="审核时间" min-width="165">
            <template #default="{ row }">{{ time(row.reviewed_at) }}</template>
          </ElTableColumn>
          <ElTableColumn prop="failure_reason" label="失败原因" min-width="130" />
          <ElTableColumn label="操作" width="76" fixed="right">
            <template #default="{ row }"
              ><ElButton text @click="openEditor(row)">编辑</ElButton></template
            >
          </ElTableColumn>
        </ElTable>
      </div>
      <div class="pager">
        <span>共 {{ total }} 条</span>
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="prev, pager, next, sizes"
          @current-change="load"
          @size-change="resize"
        />
      </div>
    </ElCard>
    <ElDialog
      v-model="visible"
      :title="current?.id ? '编辑提现申请' : '添加提现记录'"
      width="600px"
    >
      <ElForm label-width="90px">
        <ElFormItem :label="current ? '客户ID' : '客户手机号'">
          <ElInputNumber v-if="current" v-model="form.customer_id" :min="1" />
          <ElInput
            v-else
            v-model.trim="form.customer_phone"
            inputmode="numeric"
            maxlength="20"
            placeholder="请输入客户手机号"
          />
        </ElFormItem>
        <ElRow class="withdrawal-amount-row" :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="提现金额">
              <ElInputNumber v-model="form.amount" :min="0.01" :precision="2" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="币种">
              <ElSelect v-model="form.currency">
                <ElOption
                  v-for="option in currencyOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <template v-if="current">
          <ElFormItem label="开户行"><ElInput v-model="form.bank_name" /></ElFormItem>
          <ElFormItem label="银行卡号"><ElInput v-model="form.bank_card" /></ElFormItem>
          <ElFormItem label="开户地址"><ElInput v-model="form.bank_address" /></ElFormItem>
        </template>
        <ElAlert
          v-else
          title="开户行和银行卡号将自动使用客户资料，开户地址如有配置也会一并带入"
          type="info"
          :closable="false"
          show-icon
        />
        <ElFormItem v-if="!current" label="申请时间">
          <ElDatePicker
            v-model="form.recorded_at"
            type="datetime"
            value-format="X"
            placeholder="请选择申请时间"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElTag v-if="!current" type="warning">待审核</ElTag>
          <ElSelect v-else v-model="form.status">
            <ElOption label="待审核" :value="2" />
            <ElOption label="成功" :value="1" />
            <ElOption label="失败" :value="3" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="current && form.status === 3" label="失败原因">
          <ElInput v-model="form.failure_reason" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" @click="save">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    fetchFinanceWithdrawals,
    saveFinanceWithdrawal,
    type FinanceWithdrawal
  } from '@/api/system-manage'

  defineOptions({ name: 'FinanceWithdrawal' })

  const currencyOptions = [
    { label: '人民币', value: 'CNY' },
    { label: '港币', value: 'HKD' }
  ]
  const currencyText = (currency: string) =>
    currencyOptions.find((option) => option.value === currency)?.label || currency || '--'

  const loading = ref(false)
  const rows = ref<FinanceWithdrawal[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const filters = reactive({ phone: '', name: '', status: '' })
  const searchItems = [
    { label: '手机号', key: 'phone', type: 'input', props: { placeholder: '请输入手机号' } },
    { label: '姓名', key: 'name', type: 'input', props: { placeholder: '请输入姓名' } },
    {
      label: '提现状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择提现状态',
        options: [
          { label: '成功', value: '1' },
          { label: '待审核', value: '2' },
          { label: '失败', value: '3' }
        ]
      }
    }
  ]

  const load = async () => {
    loading.value = true
    try {
      const data = await fetchFinanceWithdrawals({
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
    void load()
  }
  const reset = () => {
    Object.assign(filters, { phone: '', name: '', status: '' })
    void search()
  }
  const resize = () => {
    page.value = 1
    void load()
  }
  const money = (value: number) => `¥${value.toFixed(2)}`
  const time = (value: string | number) =>
    typeof value === 'number'
      ? new Date(value * 1000).toLocaleString('zh-CN', { hour12: false })
      : value
        ? new Date(value).toLocaleString('zh-CN', { hour12: false })
        : '--'
  const statusText = (status: number) => (status === 1 ? '成功' : status === 2 ? '待审核' : '失败')
  const statusType = (status: number) =>
    status === 1 ? 'success' : status === 2 ? 'warning' : 'danger'

  const visible = ref(false)
  const current = ref<FinanceWithdrawal | null>(null)
  const form = reactive({
    customer_id: 0,
    customer_phone: '',
    amount: 0,
    currency: 'CNY',
    method: '银行卡',
    bank_name: '',
    bank_card: '',
    bank_address: '',
    status: 2,
    failure_reason: '',
    recorded_at: String(Math.floor(Date.now() / 1000))
  })
  const openEditor = (row?: FinanceWithdrawal) => {
    current.value = row || null
    Object.assign(
      form,
      row
        ? {
            customer_id: row.customer_id,
            customer_phone: row.customer_phone,
            amount: row.amount,
            currency: row.currency,
            method: row.method,
            bank_name: row.bank_name,
            bank_card: row.bank_card,
            bank_address: row.bank_address,
            status: row.status,
            failure_reason: row.failure_reason,
            recorded_at: String(Math.floor(new Date(row.created_at).getTime() / 1000))
          }
        : {
            customer_id: 0,
            customer_phone: '',
            amount: 0,
            currency: 'CNY',
            method: '银行卡',
            bank_name: '',
            bank_card: '',
            bank_address: '',
            status: 2,
            failure_reason: '',
            recorded_at: String(Math.floor(Date.now() / 1000))
          }
    )
    visible.value = true
  }
  const save = async () => {
    if (!form.amount) return ElMessage.warning('请输入提现金额')
    if (!current.value && !form.customer_phone) return ElMessage.warning('请输入客户手机号')
    await saveFinanceWithdrawal({
      id: current.value?.id,
      ...form,
      recorded_at: Number(form.recorded_at)
    })
    ElMessage.success('提现申请已保存')
    visible.value = false
    void load()
  }

  let autoRefreshTimer: ReturnType<typeof setInterval> | undefined
  const startAutoRefresh = () => {
    if (autoRefreshTimer) return
    autoRefreshTimer = setInterval(() => {
      if (!document.hidden && !visible.value && !loading.value) void load()
    }, 15_000)
  }
  const stopAutoRefresh = () => {
    if (!autoRefreshTimer) return
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = undefined
  }
  onMounted(() => {
    void load()
    startAutoRefresh()
  })
  onActivated(() => {
    void load()
    startAutoRefresh()
  })
  onDeactivated(stopAutoRefresh)
  onBeforeUnmount(stopAutoRefresh)
</script>

<style scoped>
  .finance-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
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

  .table-wrap {
    flex: 1;
    min-height: 0;
  }

  .pager {
    display: flex;
    flex: none;
    gap: 14px;
    justify-content: flex-end;
    padding-top: 14px;
  }

  :deep(.el-input-number),
  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-input-number .el-input),
  :deep(.el-input-number .el-input__wrapper),
  :deep(.el-input-number .el-input__inner) {
    min-width: 0;
  }

  @media (width <= 600px) {
    .withdrawal-amount-row :deep(.el-col) {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }
</style>
