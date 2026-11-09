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
        <template #left><ElButton @click="openCreate">添加提现记录</ElButton></template>
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
          <ElTableColumn label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <template v-if="row.status === 2">
                <ElButton link type="success" :disabled="saving" @click="openReview(row, 1)"
                  >通过</ElButton
                >
                <ElButton link type="danger" :disabled="saving" @click="openReview(row, 3)"
                  >失败</ElButton
                >
              </template>
              <span v-else>{{ row.status === 1 || row.status === 3 ? '已处理' : '状态异常' }}</span>
            </template>
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
      :title="current ? (reviewStatus === 1 ? '提现审核通过' : '提现审核失败') : '添加提现记录'"
      width="560px"
      :close-on-click-modal="!saving"
      :close-on-press-escape="!saving"
      :show-close="!saving"
      :before-close="closeEditor"
    >
      <ElForm label-width="90px" :disabled="saving">
        <template v-if="current">
          <ElFormItem label="客户"
            >{{ current.customer_name }}（{{ current.customer_phone }}）</ElFormItem
          >
          <ElFormItem label="提现金额"
            >{{ money(current.amount) }} {{ currencyText(current.currency) }}</ElFormItem
          >
          <ElFormItem label="收款银行">{{ current.bank_name || '未填写' }}</ElFormItem>
          <ElFormItem label="银行卡号">{{ current.bank_card || '未填写' }}</ElFormItem>
          <ElFormItem label="开户地址">{{ current.bank_address || '未填写' }}</ElFormItem>
          <ElAlert
            :title="
              reviewStatus === 1
                ? '请确认已完成实际银行转账。确认通过后，此提现单会记为出账，不能重复审核。'
                : '确认失败后会将本次提现冻结的资金退回客户可用余额，此提现单不能再次审核。'
            "
            type="warning"
            :closable="false"
            show-icon
          />
          <ElFormItem v-if="reviewStatus === 3" label="失败原因" required>
            <ElInput
              v-model="failureReason"
              type="textarea"
              :rows="3"
              placeholder="请填写提现失败原因"
            />
          </ElFormItem>
          <ElFormItem label="审核备注"><ElInput v-model="reviewRemark" /></ElFormItem>
        </template>
        <template v-else>
          <ElFormItem label="客户手机号">
            <ElInput
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
          <ElAlert
            title="开户行和银行卡号将自动使用客户资料，开户地址如有配置也会一并带入"
            type="info"
            :closable="false"
            show-icon
          />
          <ElFormItem label="申请时间">
            <ElDatePicker
              v-model="form.recorded_at"
              type="datetime"
              value-format="X"
              placeholder="请选择申请时间"
              style="width: 100%"
            />
          </ElFormItem>
          <ElFormItem label="状态"><ElTag type="warning">待审核</ElTag></ElFormItem>
        </template>
      </ElForm>
      <template #footer>
        <ElButton :disabled="saving" @click="visible = false">取消</ElButton>
        <ElButton
          :type="current && reviewStatus === 3 ? 'danger' : 'primary'"
          :loading="saving"
          @click="save"
          >{{
            current
              ? reviewStatus === 1
                ? '确认通过并出账'
                : '确认失败并退回资金'
              : '保存待审核记录'
          }}</ElButton
        >
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
  const saving = ref(false)
  const current = ref<FinanceWithdrawal | null>(null)
  const reviewStatus = ref<1 | 3>(1)
  const failureReason = ref('')
  const reviewRemark = ref('')
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
  const closeEditor = (done: () => void) => {
    if (!saving.value) done()
  }
  const openCreate = () => {
    current.value = null
    Object.assign(form, {
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
    visible.value = true
  }
  const openReview = (row: FinanceWithdrawal, status: 1 | 3) => {
    if (row.status !== 2) return ElMessage.warning('提现申请已处理，不能重复审核')
    current.value = row
    reviewStatus.value = status
    failureReason.value = ''
    reviewRemark.value = row.remark || ''
    visible.value = true
  }
  const save = async () => {
    if (saving.value) return
    if (current.value && reviewStatus.value === 3 && !failureReason.value.trim())
      return ElMessage.warning('请填写提现失败原因')
    if (!current.value && (!form.amount || !form.customer_phone))
      return ElMessage.warning('请输入客户手机号和提现金额')
    saving.value = true
    try {
      await saveFinanceWithdrawal(
        current.value
          ? {
              id: current.value.id,
              customer_id: current.value.customer_id,
              amount: current.value.amount,
              status: reviewStatus.value,
              failure_reason: reviewStatus.value === 3 ? failureReason.value.trim() : '',
              remark: reviewRemark.value.trim()
            }
          : { ...form, recorded_at: Number(form.recorded_at) }
      )
      ElMessage.success(
        current.value
          ? reviewStatus.value === 1
            ? '提现已通过并记为出账'
            : '提现已标记失败，资金已退回'
          : '已添加待审核提现记录'
      )
      visible.value = false
      await load()
    } finally {
      saving.value = false
    }
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
