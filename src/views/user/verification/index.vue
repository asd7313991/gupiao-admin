<template>
  <div class="page art-full-height">
    <ArtSearchBar
      v-model="filters"
      :items="searchItems"
      :show-expand="false"
      @search="load"
      @reset="reset"
    />
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="loading" @refresh="load"
        ><template #left
          ><ElButton :disabled="!selected.length" @click="batchReview">批量通过</ElButton
          ><ElButton :disabled="!selected.length" @click="batchStatus(2)">批量禁用</ElButton
          ><ElButton :disabled="!selected.length" @click="batchStatus(1)"
            >批量启用</ElButton
          ></template
        ></ArtTableHeader
      >
      <ElTable
        ref="tableRef"
        v-loading="loading"
        :data="rows"
        @selection-change="selected = $event"
      >
        <ElTableColumn type="selection" width="48" />
        <ElTableColumn type="index" label="序号" width="60" /><ElTableColumn
          prop="id"
          label="用户ID"
          width="80"
        /><ElTableColumn prop="phone" label="手机号" /><ElTableColumn
          prop="name"
          label="姓名"
        /><ElTableColumn prop="id_card" label="身份证号" min-width="180" />
        <ElTableColumn label="身份证正面" width="130"
          ><template #default="{ row }"
            ><ElImage
              v-if="row.id_card_front"
              :src="row.id_card_front"
              :preview-src-list="[row.id_card_front]"
              fit="cover"
              class="credential"
            /><span v-else>未上传</span></template
          ></ElTableColumn
        >
        <ElTableColumn label="身份证背面" width="130"
          ><template #default="{ row }"
            ><ElImage
              v-if="row.id_card_back"
              :src="row.id_card_back"
              :preview-src-list="[row.id_card_back]"
              fit="cover"
              class="credential"
            /><span v-else>未上传</span></template
          ></ElTableColumn
        >
        <ElTableColumn label="认证视频"
          ><template #default="{ row }">{{
            row.verification_video ? '已上传' : '未上传'
          }}</template></ElTableColumn
        >
        <ElTableColumn label="认证状态" width="100"
          ><template #default="{ row }"
            ><ElTag :type="verificationType(row.verified)">{{
              verificationText(row.verified)
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn label="账户状态" width="100"
          ><template #default="{ row }"
            ><ElTag :type="row.status === 1 ? 'success' : 'danger'">{{
              row.status === 1 ? '正常' : '禁用'
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn prop="updated_at" label="更新时间" min-width="170" />
        <ElTableColumn label="操作" width="80" fixed="right"
          ><template #default="{ row }"
            ><ElDropdown trigger="click"
              ><ElButton text class="more">⋮</ElButton
              ><template #dropdown
                ><ElDropdownMenu
                  ><ElDropdownItem @click="view(row)">查看详情</ElDropdownItem
                  ><ElDropdownItem :disabled="row.verified === 1" @click="review(row, 1)"
                    >人工通过</ElDropdownItem
                  ><ElDropdownItem :disabled="row.verified === 3" @click="review(row, 3)"
                    >驳回认证</ElDropdownItem
                  ><ElDropdownItem divided class="danger" @click="toggleStatus(row)">{{
                    row.status === 1 ? '禁用账户' : '启用账户'
                  }}</ElDropdownItem></ElDropdownMenu
                ></template
              ></ElDropdown
            ></template
          ></ElTableColumn
        >
      </ElTable>
    </ElCard>

    <ElDialog v-model="detailVisible" title="实名认证详情" width="720px"
      ><ElDescriptions v-if="detail" :column="2" border
        ><ElDescriptionsItem label="用户ID">{{ detail.id }}</ElDescriptionsItem
        ><ElDescriptionsItem label="手机号">{{ detail.phone }}</ElDescriptionsItem
        ><ElDescriptionsItem label="姓名">{{ detail.name }}</ElDescriptionsItem
        ><ElDescriptionsItem label="身份证号">{{ detail.id_card }}</ElDescriptionsItem
        ><ElDescriptionsItem label="认证状态"
          ><ElTag :type="verificationType(detail.verified)">{{
            verificationText(detail.verified)
          }}</ElTag></ElDescriptionsItem
        ><ElDescriptionsItem label="账户状态"
          ><ElTag :type="detail.status === 1 ? 'success' : 'danger'">{{
            detail.status === 1 ? '正常' : '禁用'
          }}</ElTag></ElDescriptionsItem
        ><ElDescriptionsItem label="审核备注" :span="2">{{
          detail.verification_remark || '无'
        }}</ElDescriptionsItem
        ><ElDescriptionsItem label="身份证正面"
          ><ElImage
            v-if="detail.id_card_front"
            :src="detail.id_card_front"
            :preview-src-list="[detail.id_card_front]"
            class="large-image"
          /><span v-else>未上传</span></ElDescriptionsItem
        ><ElDescriptionsItem label="身份证背面"
          ><ElImage
            v-if="detail.id_card_back"
            :src="detail.id_card_back"
            :preview-src-list="[detail.id_card_back]"
            class="large-image"
          /><span v-else>未上传</span></ElDescriptionsItem
        ><ElDescriptionsItem label="认证视频" :span="2">{{
          detail.verification_video || '未上传'
        }}</ElDescriptionsItem></ElDescriptions
      ><template #footer
        ><ElButton @click="detailVisible = false">关闭</ElButton></template
      ></ElDialog
    >
    <ElDialog
      v-model="reviewVisible"
      :title="reviewState === 1 ? '人工审核通过' : '驳回实名认证'"
      width="460px"
      ><ElForm label-width="90px"
        ><ElFormItem label="审核结果"
          ><ElTag :type="reviewState === 1 ? 'success' : 'danger'">{{
            reviewState === 1 ? '通过' : '驳回'
          }}</ElTag></ElFormItem
        ><ElFormItem label="审核备注" :required="reviewState === 3"
          ><ElInput
            v-model="reviewRemark"
            type="textarea"
            :rows="3"
            :placeholder="
              reviewState === 3 ? '请填写驳回原因' : '可填写审核备注'
            " /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="reviewVisible = false">取消</ElButton
        ><ElButton type="primary" @click="submitReview">确认审核</ElButton></template
      ></ElDialog
    >
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    batchReviewCustomerVerification,
    batchUpdateCustomerStatus,
    fetchCustomerDetail,
    fetchCustomers,
    reviewCustomerVerification,
    updateCustomerStatus,
    type Customer
  } from '@/api/system-manage'
  defineOptions({ name: 'UserVerification' })
  const loading = ref(false),
    rows = ref<Customer[]>([]),
    selected = ref<Customer[]>([]),
    tableRef = ref(),
    filters = reactive({ phone: '', name: '', idCard: '' })
  const searchItems = [
    { label: '手机号', key: 'phone', type: 'input', props: { placeholder: '请输入手机号' } },
    { label: '姓名', key: 'name', type: 'input', props: { placeholder: '请输入姓名' } },
    { label: '身份证号', key: 'idCard', type: 'input', props: { placeholder: '请输入身份证号' } }
  ]
  const load = async () => {
    loading.value = true
    try {
      const data = await fetchCustomers({ page: 1, pageSize: 100, ...filters })
      rows.value = data.records
      selected.value = []
      nextTick(() => tableRef.value?.clearSelection())
    } finally {
      loading.value = false
    }
  }
  const reset = () => {
    Object.assign(filters, { phone: '', name: '', idCard: '' })
    load()
  }
  const verificationText = (status: number) =>
    status === 1 ? '已审核' : status === 3 ? '已驳回' : '待审核'
  const verificationType = (status: number) =>
    status === 1 ? 'success' : status === 3 ? 'danger' : 'warning'
  const detailVisible = ref(false),
    detail = ref<Customer | null>(null)
  const view = async (row: Customer) => {
    detail.value = await fetchCustomerDetail(row.id)
    detailVisible.value = true
  }
  const reviewVisible = ref(false),
    reviewState = ref(1),
    reviewTarget = ref<Customer | null>(null),
    reviewRemark = ref('')
  const review = (row: Customer, state: number) => {
    reviewTarget.value = row
    reviewState.value = state
    reviewRemark.value = ''
    reviewVisible.value = true
  }
  const submitReview = async () => {
    if (!reviewTarget.value) return
    if (reviewState.value === 3 && !reviewRemark.value.trim())
      return ElMessage.warning('请填写驳回原因')
    await reviewCustomerVerification({
      id: reviewTarget.value.id,
      verified: reviewState.value,
      remark: reviewRemark.value.trim()
    })
    ElMessage.success('审核结果已保存')
    reviewVisible.value = false
    load()
  }
  const toggleStatus = async (row: Customer) => {
    const next = row.status === 1 ? 2 : 1
    await ElMessageBox.confirm(
      `确定${next === 2 ? '禁用' : '启用'}客户「${row.name}」吗？`,
      '账户状态',
      { type: 'warning' }
    )
    await updateCustomerStatus(row.id, next)
    ElMessage.success('账户状态已更新')
    load()
  }
  const batchReview = async () => {
    const ids = selected.value.map((item) => item.id)
    await ElMessageBox.confirm(`确定批量通过 ${ids.length} 位客户的实名认证吗？`, '批量审核', {
      type: 'warning'
    })
    await batchReviewCustomerVerification(ids)
    ElMessage.success('批量审核已完成')
    load()
  }
  const batchStatus = async (status: number) => {
    const ids = selected.value.map((item) => item.id)
    await ElMessageBox.confirm(
      `确定批量${status === 2 ? '禁用' : '启用'} ${ids.length} 位客户吗？`,
      '批量账户操作',
      { type: 'warning' }
    )
    await batchUpdateCustomerStatus(ids, status)
    ElMessage.success('批量账户状态已更新')
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

  .credential {
    width: 72px;
    height: 48px;
  }

  .large-image {
    width: 180px;
    height: 120px;
    object-fit: cover;
  }

  .more {
    font-size: 22px;
  }

  .danger {
    color: var(--el-color-danger);
  }
</style>
