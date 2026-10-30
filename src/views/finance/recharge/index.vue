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
        <template #left><ElButton @click="openCreate">添加充值记录</ElButton></template>
      </ArtTableHeader>
      <div class="table-wrap">
        <ElTable v-loading="loading" :data="rows" height="100%">
          <ElTableColumn type="selection" width="42" />
          <ElTableColumn prop="id" label="ID" width="70" />
          <ElTableColumn prop="customer_phone" label="手机号" />
          <ElTableColumn prop="customer_name" label="姓名" />
          <ElTableColumn label="充值凭证" width="100"
            ><template #default="{ row }"
              ><ElTag v-if="row.voucher" type="success">已上传</ElTag
              ><span v-else>-</span></template
            ></ElTableColumn
          >
          <ElTableColumn prop="method" label="充值方式" />
          <ElTableColumn label="充值金额"
            ><template #default="{ row }">{{ money(row.amount) }}</template></ElTableColumn
          >
          <ElTableColumn prop="currency" label="币种" />
          <ElTableColumn label="状态"
            ><template #default="{ row }"
              ><ElTag :type="statusType(row.status)">{{ statusText(row.status) }}</ElTag></template
            ></ElTableColumn
          >
          <ElTableColumn label="创建时间" min-width="165"
            ><template #default="{ row }">{{ time(row.created_at) }}</template></ElTableColumn
          >
          <ElTableColumn label="审核时间" min-width="165"
            ><template #default="{ row }">{{ time(row.reviewed_at) }}</template></ElTableColumn
          >
          <ElTableColumn prop="remark" label="备注" min-width="130" />
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
      <div class="pager"
        ><span>共 {{ total }} 条</span
        ><ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="prev, pager, next, sizes"
          @current-change="load"
          @size-change="resize"
      /></div>
    </ElCard>
    <ElDialog
      v-model="visible"
      :title="current ? (reviewStatus === 1 ? '充值审核通过' : '充值审核失败') : '添加充值记录'"
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
          <ElFormItem label="充值金额"
            >{{ money(current.amount) }} {{ current.currency }}</ElFormItem
          >
          <ElAlert
            :title="
              reviewStatus === 1
                ? '请核实款项已收到。确认通过后按此充值单的金额和币种入账，不能重复审核。'
                : '确认失败后不入账，此充值单不能再次审核。'
            "
            type="warning"
            :closable="false"
            show-icon
          />
          <ElFormItem v-if="reviewStatus === 3" label="失败原因" required
            ><ElInput
              v-model="failureReason"
              type="textarea"
              :rows="3"
              placeholder="请填写充值失败原因"
          /></ElFormItem>
          <ElFormItem label="审核备注"><ElInput v-model="reviewRemark" /></ElFormItem>
        </template>
        <template v-else>
          <ElFormItem label="客户ID"
            ><ElInputNumber v-model="form.customer_id" :min="1"
          /></ElFormItem>
          <ElFormItem label="充值金额"
            ><ElInputNumber v-model="form.amount" :min="0.01" :precision="2"
          /></ElFormItem>
          <ElFormItem label="币种"
            ><ElSelect v-model="form.currency"
              ><ElOption label="CNY" value="CNY" /><ElOption label="HKD" value="HKD" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="充值方式"><ElInput v-model="form.method" /></ElFormItem>
          <ElFormItem label="状态"><ElTag type="warning">待审核</ElTag></ElFormItem>
          <ElFormItem label="备注"><ElInput v-model="form.remark" /></ElFormItem>
        </template>
      </ElForm>
      <template #footer
        ><ElButton :disabled="saving" @click="visible = false">取消</ElButton
        ><ElButton
          :type="current && reviewStatus === 3 ? 'danger' : 'primary'"
          :loading="saving"
          @click="save"
          >{{
            current ? (reviewStatus === 1 ? '确认通过并入账' : '确认失败') : '保存待审核记录'
          }}</ElButton
        ></template
      >
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    fetchFinanceRecharges,
    saveFinanceRecharge,
    type FinanceRecharge
  } from '@/api/system-manage'
  defineOptions({ name: 'FinanceRecharge' })
  const loading = ref(false),
    rows = ref<FinanceRecharge[]>([]),
    total = ref(0),
    page = ref(1),
    pageSize = ref(20)
  const filters = reactive({ phone: '', name: '', status: '' })
  const searchItems = [
    { label: '手机号', key: 'phone', type: 'input', props: { placeholder: '请输入手机号' } },
    { label: '姓名', key: 'name', type: 'input', props: { placeholder: '请输入姓名' } },
    {
      label: '充值状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择充值状态',
        options: [
          { label: '通过', value: '1' },
          { label: '失败', value: '3' },
          { label: '待审核', value: '2' }
        ]
      }
    }
  ]
  const load = async () => {
    loading.value = true
    try {
      const data = await fetchFinanceRecharges({
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
    search()
  }
  const resize = () => {
    page.value = 1
    void load()
  }
  const money = (value: number) => value.toFixed(2)
  const time = (value: string | number) =>
    !value
      ? '--'
      : new Date(typeof value === 'number' ? value * 1000 : value).toLocaleString('zh-CN', {
          hour12: false
        })
  const statusText = (status: number) =>
    status === 1 ? '通过' : status === 2 ? '待审核' : status === 3 ? '失败' : '状态异常'
  const statusType = (status: number) =>
    status === 1 ? 'success' : status === 3 ? 'danger' : 'warning'
  const visible = ref(false),
    saving = ref(false),
    current = ref<FinanceRecharge | null>(null)
  const reviewStatus = ref<1 | 3>(1),
    failureReason = ref(''),
    reviewRemark = ref('')
  const form = reactive({
    customer_id: 1,
    amount: 0,
    currency: 'CNY',
    method: '支付宝转账',
    remark: ''
  })
  const closeEditor = (done: () => void) => {
    if (!saving.value) done()
  }
  const openCreate = () => {
    current.value = null
    Object.assign(form, {
      customer_id: 1,
      amount: 0,
      currency: 'CNY',
      method: '支付宝转账',
      remark: ''
    })
    visible.value = true
  }
  const openReview = (row: FinanceRecharge, status: 1 | 3) => {
    if (row.status !== 2) return ElMessage.warning('充值申请已处理，不能重复审核')
    current.value = row
    reviewStatus.value = status
    failureReason.value = ''
    reviewRemark.value = row.remark || ''
    visible.value = true
  }
  const save = async () => {
    if (saving.value) return
    if (current.value && reviewStatus.value === 3 && !failureReason.value.trim())
      return ElMessage.warning('请填写充值失败原因')
    if (
      !current.value &&
      (!Number.isFinite(form.amount) ||
        form.amount <= 0 ||
        !Number.isInteger(form.customer_id) ||
        form.customer_id < 1)
    )
      return ElMessage.warning('请输入有效的客户ID和充值金额')
    saving.value = true
    try {
      await saveFinanceRecharge(
        current.value
          ? {
              id: current.value.id,
              customer_id: current.value.customer_id,
              amount: current.value.amount,
              status: reviewStatus.value,
              failure_reason: reviewStatus.value === 3 ? failureReason.value.trim() : '',
              remark: reviewRemark.value.trim()
            }
          : { ...form, status: 2 }
      )
      ElMessage.success(
        current.value
          ? reviewStatus.value === 1
            ? '充值已通过并入账'
            : '充值已标记失败，未入账'
          : '已添加待审核充值记录'
      )
      visible.value = false
      await load()
    } finally {
      saving.value = false
    }
  }
  onMounted(load)
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
</style>
