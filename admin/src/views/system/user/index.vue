<template>
  <div class="customer-page art-full-height">
    <ArtSearchBar
      v-model="filters"
      :items="searchItems"
      :show-expand="false"
      @search="load"
      @reset="reset"
    />
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="loading" @refresh="load"
        ><template #left><ElButton @click="edit()">新增客户</ElButton></template></ArtTableHeader
      >
      <ElTable v-loading="loading" :data="customers" height="calc(100% - 68px)">
        <ElTableColumn type="selection" width="42" /><ElTableColumn
          prop="id"
          label="ID"
          width="60"
        />
        <ElTableColumn label="姓名/手机号" min-width="126"
          ><template #default="{ row }"
            ><b class="name">{{ row.name }}</b
            ><small>{{ row.phone }}</small></template
          ></ElTableColumn
        >
        <ElTableColumn label="总资产" width="110"
          ><template #default="{ row }">{{
            money(row.balance + row.frozen_balance)
          }}</template></ElTableColumn
        >
        <ElTableColumn label="人民币账户" min-width="140"
          ><template #default="{ row }"
            ><b class="money">可用 {{ money(row.balance) }}</b
            ><small>冻结 {{ money(row.frozen_balance) }}</small></template
          ></ElTableColumn
        >
        <ElTableColumn label="港币账户" min-width="120"
          ><template #default
            ><b class="money">可用 ¥0.00</b><small>冻结 ¥0.00</small></template
          ></ElTableColumn
        >
        <ElTableColumn prop="id_card" label="身份证号码" min-width="150" /><ElTableColumn
          label="总亏损"
          width="100"
          ><template #default="{ row }"
            ><span class="loss">{{ money(row.total_loss) }}</span></template
          ></ElTableColumn
        ><ElTableColumn label="总盈利" width="100"
          ><template #default="{ row }">{{ money(row.total_profit) }}</template></ElTableColumn
        >
        <ElTableColumn label="资金状态" width="84"
          ><template #default="{ row }"
            ><ElTag :type="row.fund_status === 1 ? 'success' : 'danger'">{{
              row.fund_status === 1 ? '正常' : '锁定'
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn label="账号状态" width="84"
          ><template #default="{ row }"
            ><ElTag :type="row.status === 1 ? 'success' : 'danger'">{{
              row.status === 1 ? '已认证' : '禁用'
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn label="注册信息" min-width="145"
          ><template #default="{ row }"
            ><small>注册时间: {{ time(row.created_at) }}</small
            ><small>IP: -</small></template
          ></ElTableColumn
        ><ElTableColumn label="登录信息" min-width="145"
          ><template #default="{ row }"
            ><small>最后时间: {{ time(row.updated_at) }}</small
            ><small>IP: -</small></template
          ></ElTableColumn
        >
        <ElTableColumn label="操作" width="66" fixed="right"
          ><template #default="{ row }"
            ><ElDropdown trigger="click"
              ><ElButton text class="more">⋮</ElButton
              ><template #dropdown
                ><ElDropdownMenu
                  ><ElDropdownItem @click="details(row)">查看详情</ElDropdownItem
                  ><ElDropdownItem @click="edit(row)">编辑</ElDropdownItem
                  ><ElDropdownItem @click="openDeposit(row)">手动入账</ElDropdownItem
                  ><ElDropdownItem @click="openPassword(row, 'login')">修改登录密码</ElDropdownItem
                  ><ElDropdownItem @click="openPassword(row, 'trade')">修改交易密码</ElDropdownItem
                  ><ElDropdownItem @click="status(row)">{{
                    row.status === 1 ? '禁用' : '启用'
                  }}</ElDropdownItem
                  ><ElDropdownItem @click="fund(row)">{{
                    row.fund_status === 1 ? '锁定资金' : '解锁资金'
                  }}</ElDropdownItem
                  ><ElDropdownItem divided class="danger" @click="remove(row)"
                    >删除</ElDropdownItem
                  ></ElDropdownMenu
                ></template
              ></ElDropdown
            ></template
          ></ElTableColumn
        >
      </ElTable>
      <div class="pager"
        ><span>共 {{ total }} 条</span
        ><ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next, sizes"
          @current-change="load"
          @size-change="load"
      /></div>
    </ElCard>

    <ElDialog v-model="editorVisible" :title="current?.id ? '编辑客户' : '添加客户'" width="760px"
      ><ElForm ref="formRef" :model="form" :rules="rules" label-width="88px"
        ><ElRow :gutter="18"
          ><ElCol :span="12"
            ><ElFormItem label="手机号" prop="phone"
              ><ElInput v-model="form.phone" /></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="姓名" prop="name"
              ><ElInput v-model="form.name" /></ElFormItem></ElCol></ElRow
        ><ElRow :gutter="18"
          ><ElCol :span="12"
            ><ElFormItem label="密码" :prop="current?.id ? '' : 'password'"
              ><ElInput
                v-model="form.password"
                show-password
                placeholder="编辑时留空不修改" /></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="交易密码"
              ><ElInput v-model="form.trade_password" show-password /></ElFormItem></ElCol></ElRow
        ><ElRow :gutter="18"
          ><ElCol :span="12"
            ><ElFormItem label="身份证号" prop="id_card"
              ><ElInput v-model="form.id_card" /></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="银行名称"
              ><ElInput v-model="form.bank_name" /></ElFormItem></ElCol></ElRow
        ><ElFormItem label="银行卡号"><ElInput v-model="form.bank_card" /></ElFormItem
        ><ElRow :gutter="18"
          ><ElCol :span="8"
            ><ElFormItem label="余额"
              ><ElInputNumber v-model="form.balance" :min="0" /></ElFormItem></ElCol
          ><ElCol :span="8"
            ><ElFormItem label="策略金"
              ><ElInputNumber v-model="form.strategy_balance" :min="0" /></ElFormItem></ElCol
          ><ElCol :span="8"
            ><ElFormItem label="冻结金额"
              ><ElInputNumber v-model="form.frozen_balance" :min="0" /></ElFormItem></ElCol></ElRow
        ><ElRow :gutter="18"
          ><ElCol :span="12"
            ><ElFormItem label="用户分组"
              ><ElSelect v-model="form.group_name" style="width: 100%"
                ><ElOption label="内部" value="内部" /><ElOption
                  label="普通"
                  value="普通" /></ElSelect></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="用户状态"><ElSwitch v-model="enabled" /></ElFormItem></ElCol></ElRow
        ><ElFormItem label="银行地址"><ElInput v-model="form.bank_address" /></ElFormItem
        ><ElFormItem label="备注"
          ><ElInput v-model="form.remark" type="textarea" :rows="3" /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="editorVisible = false">取消</ElButton
        ><ElButton type="primary" @click="save">提交</ElButton></template
      ></ElDialog
    >
    <ElDialog v-model="detailVisible" title="客户详情" width="730px"
      ><ElDescriptions v-if="detail" :column="2" border
        ><ElDescriptionsItem label="用户ID">{{ detail.id }}</ElDescriptionsItem
        ><ElDescriptionsItem label="手机号">{{ detail.phone }}</ElDescriptionsItem
        ><ElDescriptionsItem label="姓名">{{ detail.name }}</ElDescriptionsItem
        ><ElDescriptionsItem label="身份证号">{{ detail.id_card }}</ElDescriptionsItem
        ><ElDescriptionsItem label="余额"
          ><b class="money">{{ money(detail.balance) }}</b></ElDescriptionsItem
        ><ElDescriptionsItem label="冻结金额"
          ><b class="loss">{{ money(detail.frozen_balance) }}</b></ElDescriptionsItem
        ><ElDescriptionsItem label="银行名称">{{ detail.bank_name || '未填写' }}</ElDescriptionsItem
        ><ElDescriptionsItem label="银行卡号">{{ detail.bank_card || '未填写' }}</ElDescriptionsItem
        ><ElDescriptionsItem label="用户分组">{{ detail.group_name }}</ElDescriptionsItem
        ><ElDescriptionsItem label="认证状态"
          ><ElTag type="success">{{
            detail.verified === 1 ? '已认证' : '未认证'
          }}</ElTag></ElDescriptionsItem
        ><ElDescriptionsItem label="银行地址" :span="2">{{
          detail.bank_address || '未填写'
        }}</ElDescriptionsItem
        ><ElDescriptionsItem label="备注" :span="2">{{
          detail.remark || '无'
        }}</ElDescriptionsItem></ElDescriptions
      ><template #footer
        ><ElButton type="primary" @click="detailVisible = false">关闭</ElButton></template
      ></ElDialog
    >
    <ElDialog v-model="depositVisible" title="手动入账" width="600px"
      ><ElForm label-width="100px"
        ><ElFormItem label="客户姓名"
          ><ElInput :model-value="depositing?.name" disabled /></ElFormItem
        ><ElFormItem label="手机号"
          ><ElInput :model-value="depositing?.phone" disabled /></ElFormItem
        ><ElFormItem label="当前余额"
          ><ElInput :model-value="money(depositing?.balance || 0)" disabled /></ElFormItem
        ><ElFormItem label="入账币种"
          ><ElRadioGroup v-model="deposit.currency"
            ><ElRadio value="CNY">人民币 (CNY)</ElRadio
            ><ElRadio value="HKD">港币 (HKD)</ElRadio></ElRadioGroup
          ></ElFormItem
        ><ElFormItem label="入账金额" required
          ><ElInputNumber v-model="deposit.amount" :precision="2" style="width: 100%" /></ElFormItem
        ><ElFormItem label="备注"><ElInput v-model="deposit.remark" /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="depositVisible = false">取消</ElButton
        ><ElButton type="primary" @click="submitDeposit">确定入账</ElButton></template
      ></ElDialog
    >
    <ElDialog
      v-model="passwordVisible"
      :title="passwordType === 'login' ? '修改登录密码' : '修改交易密码'"
      width="450px"
      ><ElForm label-width="90px"
        ><ElFormItem label="客户"
          ><ElInput :model-value="passwordCustomer?.name" disabled /></ElFormItem
        ><ElFormItem label="新密码" required
          ><ElInput
            v-model="passwordForm.value"
            type="password"
            show-password
            placeholder="至少 6 位" /></ElFormItem
        ><ElFormItem label="确认密码" required
          ><ElInput
            v-model="passwordForm.confirm"
            type="password"
            show-password /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="passwordVisible = false">取消</ElButton
        ><ElButton type="primary" @click="submitPassword">确定</ElButton></template
      ></ElDialog
    >
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import {
    createCustomer,
    deleteCustomer,
    depositCustomer,
    fetchCustomerDetail,
    fetchCustomers,
    updateCustomer,
    updateCustomerFundStatus,
    updateCustomerPassword,
    updateCustomerStatus,
    type Customer
  } from '@/api/system-manage'
  defineOptions({ name: 'CustomerList' })
  const loading = ref(false),
    customers = ref<Customer[]>([]),
    total = ref(0),
    page = ref(1),
    pageSize = ref(20)
  const filters = reactive({
    phone: '',
    idCard: '',
    name: '',
    group: '',
    status: undefined as number | undefined
  })
  const searchItems = [
    { label: '手机号', key: 'phone', type: 'input', props: { placeholder: '请输入手机号' } },
    { label: '身份证号', key: 'idCard', type: 'input', props: { placeholder: '请输入身份证号' } },
    { label: '姓名', key: 'name', type: 'input', props: { placeholder: '请输入姓名' } },
    {
      label: '用户分组',
      key: 'group',
      type: 'select',
      props: {
        placeholder: '请选择分组',
        options: [
          { label: '内部', value: '内部' },
          { label: '普通', value: '普通' }
        ]
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        options: [
          { label: '正常', value: 1 },
          { label: '禁用', value: 2 }
        ]
      }
    }
  ]
  const load = async () => {
    loading.value = true
    try {
      const result = await fetchCustomers({
        page: page.value,
        pageSize: pageSize.value,
        ...filters
      })
      customers.value = result.records
      total.value = result.total
    } finally {
      loading.value = false
    }
  }
  const reset = () => {
    Object.assign(filters, { phone: '', idCard: '', name: '', group: '', status: undefined })
    page.value = 1
    load()
  }
  const money = (value: number) =>
    `¥${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const time = (value: string | number) =>
    value
      ? new Date(typeof value === 'number' ? value * 1000 : value).toLocaleString('zh-CN', {
          hour12: false
        })
      : '-'
  const empty = () => ({
    phone: '',
    name: '',
    id_card: '',
    password: '',
    trade_password: '',
    bank_name: '',
    bank_card: '',
    bank_address: '',
    group_name: '内部',
    balance: 0,
    strategy_balance: 0,
    frozen_balance: 0,
    status: 1,
    fund_status: 1,
    remark: ''
  })
  const editorVisible = ref(false),
    current = ref<Customer | null>(null),
    form = reactive(empty()),
    enabled = ref(true),
    formRef = ref<FormInstance>()
  const rules: FormRules = {
    phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    id_card: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  }
  const edit = (row?: Customer) => {
    current.value = row || null
    Object.assign(form, row ? { ...empty(), ...row } : empty())
    enabled.value = (row?.status ?? 1) === 1
    editorVisible.value = true
  }
  const save = async () => {
    await formRef.value?.validate()
    const data = { ...form, status: enabled.value ? 1 : 2, fund_status: form.fund_status || 1 }
    if (current.value) await updateCustomer({ ...data, id: current.value.id })
    else await createCustomer(data)
    ElMessage.success('保存成功')
    editorVisible.value = false
    load()
  }
  const detailVisible = ref(false),
    detail = ref<Customer | null>(null)
  const details = async (row: Customer) => {
    detail.value = await fetchCustomerDetail(row.id)
    detailVisible.value = true
  }
  const depositVisible = ref(false),
    depositing = ref<Customer | null>(null),
    deposit = reactive({ currency: 'CNY', amount: 0, remark: '' })
  const openDeposit = (row: Customer) => {
    depositing.value = row
    Object.assign(deposit, { currency: 'CNY', amount: 0, remark: '' })
    depositVisible.value = true
  }
  const submitDeposit = async () => {
    if (!depositing.value || !deposit.amount) return ElMessage.warning('请输入入账金额')
    await depositCustomer({ id: depositing.value.id, ...deposit })
    ElMessage.success('入账成功')
    depositVisible.value = false
    load()
  }
  const passwordVisible = ref(false),
    passwordCustomer = ref<Customer | null>(null),
    passwordType = ref<'login' | 'trade'>('login'),
    passwordForm = reactive({ value: '', confirm: '' })
  const openPassword = (row: Customer, type: 'login' | 'trade') => {
    passwordCustomer.value = row
    passwordType.value = type
    Object.assign(passwordForm, { value: '', confirm: '' })
    passwordVisible.value = true
  }
  const submitPassword = async () => {
    if (!passwordCustomer.value) return
    if (passwordForm.value.length < 6) return ElMessage.warning('密码至少 6 位')
    if (passwordForm.value !== passwordForm.confirm)
      return ElMessage.warning('两次输入的密码不一致')
    await updateCustomerPassword({
      id: passwordCustomer.value.id,
      password: passwordForm.value,
      type: passwordType.value
    })
    ElMessage.success('密码已修改')
    passwordVisible.value = false
  }
  const status = async (row: Customer) => {
    await updateCustomerStatus(row.id, row.status === 1 ? 2 : 1)
    ElMessage.success('状态已更新')
    load()
  }
  const fund = async (row: Customer) => {
    await updateCustomerFundStatus(row.id, row.fund_status === 1 ? 2 : 1)
    ElMessage.success('资金状态已更新')
    load()
  }
  const remove = async (row: Customer) => {
    await ElMessageBox.confirm(`确定删除客户「${row.name}」吗？`, '删除客户', { type: 'warning' })
    await deleteCustomer(row.id)
    ElMessage.success('删除成功')
    load()
  }
  onMounted(load)
</script>

<style scoped lang="scss">
  .customer-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .art-table-card {
    flex: 1;
    min-height: 0;
  }

  :deep(.el-table .cell) {
    font-size: 12px;
  }

  small {
    display: block;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  .name {
    display: block;
    color: var(--el-color-danger);
  }

  .money {
    color: var(--el-color-success);
  }

  .loss,
  .danger {
    color: var(--el-color-danger);
  }

  .more {
    font-size: 22px;
    line-height: 1;
  }

  .pager {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: flex-end;
    padding-top: 14px;
    color: var(--el-text-color-secondary);
  }

  :deep(.el-input-number) {
    width: 100%;
  }
</style>
