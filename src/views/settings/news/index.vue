<template>
  <div class="news-page art-full-height">
    <ArtSearchBar
      v-model="filters"
      :items="searchItems"
      :show-expand="false"
      @search="search"
      @reset="reset"
    />
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="loading" @refresh="loadNews">
        <template #left>
          <ElButton type="warning" :loading="collecting" @click="collectAll">手动采集</ElButton>
          <ElButton :disabled="selected.length === 0" @click="batchHide">批量隐藏</ElButton>
          <ElButton :disabled="selected.length === 0" type="danger" @click="batchDelete"
            >批量删除</ElButton
          >
        </template>
      </ArtTableHeader>
      <ElTable v-loading="loading" :data="rows" @selection-change="onSelectionChange">
        <ElTableColumn type="selection" width="42" />
        <ElTableColumn prop="id" label="ID" width="70" />
        <ElTableColumn prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <ElTableColumn prop="category" label="分类" width="130" />
        <ElTableColumn prop="content_type" label="类型" width="110" />
        <ElTableColumn prop="source_name" label="来源" min-width="120" />
        <ElTableColumn label="关联证券" min-width="140">
          <template #default="{ row }">{{
            (row.security_codes || []).join(', ') || '--'
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }">
            <ElTag
              :type="
                row.status === 'published'
                  ? 'success'
                  : row.status === 'hidden'
                    ? 'info'
                    : 'warning'
              "
            >
              {{
                row.status === 'published' ? '已上架' : row.status === 'hidden' ? '已下架' : '草稿'
              }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="置顶" width="90">
          <template #default="{ row }">
            <ElSwitch :model-value="row.is_top" @change="toggleTop(row)" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="发布时间" min-width="160">
          <template #default="{ row }">{{ time(row.published_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="采集时间" min-width="160">
          <template #default="{ row }">{{ time(row.collected_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <ElDropdown trigger="click">
              <ElButton text>操作</ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem @click="openEdit(row)">编辑</ElDropdownItem>
                  <ElDropdownItem @click="toggleStatus(row)">
                    {{ row.status === 'hidden' ? '上架' : '下架' }}
                  </ElDropdownItem>
                  <ElDropdownItem @click="openSource(row.source_url)">原文</ElDropdownItem>
                  <ElDropdownItem divided class="danger" @click="remove(row)">删除</ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="pager">
        <span>共 {{ total }} 条</span>
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next, sizes"
          @current-change="loadNews"
          @size-change="loadNews"
        />
      </div>
    </ElCard>

    <ElCard class="source-card" shadow="never">
      <template #header>
        <div class="source-card-header">
          <div class="card-title">新闻源管理</div>
          <ElButton type="primary" @click="openSourceCreate">新增新闻源</ElButton>
        </div>
      </template>
      <ElTable :data="sources" size="small">
        <ElTableColumn prop="name" label="名称" min-width="160" />
        <ElTableColumn prop="source_type" label="类型" width="90" />
        <ElTableColumn prop="base_url" label="地址" min-width="260" show-overflow-tooltip />
        <ElTableColumn prop="interval_seconds" label="间隔(s)" width="90" />
        <ElTableColumn prop="consecutive_failures" label="连续失败" width="90" />
        <ElTableColumn label="启用" width="90">
          <template #default="{ row }">
            <ElSwitch :model-value="row.enabled" @change="toggleSource(row)" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="最近成功" min-width="160">
          <template #default="{ row }">{{ time(row.last_success_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="100">
          <template #default="{ row }">
            <ElButton text type="primary" @click="openSourceEdit(row)">编辑</ElButton>
            <ElButton
              text
              type="primary"
              :loading="collectingSourceId === row.id"
              @click="collectOne(row.id)"
              >采集</ElButton
            >
            <ElButton text type="danger" @click="removeSource(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElCard class="log-card" shadow="never">
      <template #header>
        <div class="card-title">采集日志</div>
      </template>
      <ElTable :data="logs" size="small">
        <ElTableColumn prop="id" label="ID" width="70" />
        <ElTableColumn prop="source_id" label="来源ID" width="80" />
        <ElTableColumn prop="status" label="状态" width="100" />
        <ElTableColumn prop="fetched_count" label="拉取" width="80" />
        <ElTableColumn prop="inserted_count" label="新增" width="80" />
        <ElTableColumn prop="updated_count" label="更新" width="80" />
        <ElTableColumn prop="duplicate_count" label="重复" width="80" />
        <ElTableColumn prop="failed_count" label="失败" width="80" />
        <ElTableColumn label="开始时间" min-width="160">
          <template #default="{ row }">{{ time(row.started_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="结束时间" min-width="160">
          <template #default="{ row }">{{ time(row.finished_at) }}</template>
        </ElTableColumn>
        <ElTableColumn
          prop="error_summary"
          label="错误摘要"
          min-width="220"
          show-overflow-tooltip
        />
      </ElTable>
      <div class="pager">
        <span>共 {{ logTotal }} 条</span>
        <ElPagination
          v-model:current-page="logPage"
          v-model:page-size="logPageSize"
          :total="logTotal"
          layout="prev, pager, next, sizes"
          @current-change="loadLogs"
          @size-change="loadLogs"
        />
      </div>
    </ElCard>

    <ElDialog v-model="sourceCreateVisible" title="新增新闻源" width="680px">
      <ElForm label-width="110px">
        <ElFormItem label="新闻源名称" required>
          <ElInput v-model="sourceCreate.name" placeholder="例如：国务院政策发布" />
        </ElFormItem>
        <ElFormItem label="类型" required>
          <ElInput v-model="sourceCreate.source_type" placeholder="例如：api" />
        </ElFormItem>
        <ElFormItem label="地址" required>
          <ElInput v-model="sourceCreate.base_url" placeholder="https://example.com/feed.json" />
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch v-model="sourceCreate.enabled" />
        </ElFormItem>
        <ElFormItem label="采集间隔(s)">
          <ElInputNumber v-model="sourceCreate.interval_seconds" :min="1" :max="86400" />
        </ElFormItem>
        <ElFormItem label="超时时间(s)">
          <ElInputNumber v-model="sourceCreate.timeout_seconds" :min="1" :max="300" />
        </ElFormItem>
        <ElFormItem label="频率限制">
          <ElInputNumber v-model="sourceCreate.rate_limit" :min="1" :max="1000" />
        </ElFormItem>
        <ElFormItem label="采集配置">
          <ElInput
            v-model="sourceCreate.config_json"
            type="textarea"
            :rows="6"
            placeholder='例如：{"adapter":"gov_cn_pushinfo"}'
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="sourceCreateVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="sourceSaving" @click="saveSourceCreate">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="sourceEditorVisible" title="编辑新闻源" width="680px">
      <ElForm label-width="110px">
        <ElFormItem label="新闻源名称">
          <ElInput :model-value="sourceCurrent?.name" disabled />
        </ElFormItem>
        <ElFormItem label="类型">
          <ElInput :model-value="sourceCurrent?.source_type" disabled />
        </ElFormItem>
        <ElFormItem label="地址">
          <ElInput :model-value="sourceCurrent?.base_url" disabled />
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch v-model="sourceEdit.enabled" />
        </ElFormItem>
        <ElFormItem label="采集间隔(s)">
          <ElInputNumber v-model="sourceEdit.interval_seconds" :min="1" :max="86400" />
        </ElFormItem>
        <ElFormItem label="超时时间(s)">
          <ElInputNumber v-model="sourceEdit.timeout_seconds" :min="1" :max="300" />
        </ElFormItem>
        <ElFormItem label="频率限制">
          <ElInputNumber v-model="sourceEdit.rate_limit" :min="1" :max="1000" />
        </ElFormItem>
        <ElFormItem label="采集配置">
          <ElInput
            v-model="sourceEdit.config_json"
            type="textarea"
            :rows="6"
            placeholder="可选 JSON 配置"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="sourceEditorVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="sourceSaving" @click="saveSourceEdit">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="editorVisible" title="编辑新闻" width="680px">
      <ElForm label-width="90px">
        <ElFormItem label="新闻ID">
          <ElInput :model-value="current?.id" disabled />
        </ElFormItem>
        <ElFormItem label="标题">
          <ElInput v-model="edit.title" maxlength="300" show-word-limit />
        </ElFormItem>
        <ElFormItem label="分类">
          <ElSelect v-model="edit.category" style="width: 100%">
            <ElOption
              v-for="item in categories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="摘要">
          <ElInput v-model="edit.summary" type="textarea" :rows="4" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="edit.status" style="width: 100%">
            <ElOption label="已发布" value="published" />
            <ElOption label="草稿" value="draft" />
            <ElOption label="隐藏" value="hidden" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="editorVisible = false">取消</ElButton>
        <ElButton type="primary" @click="saveEdit">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    batchFinanceNewsAction,
    collectFinanceNews,
    createNewsSource,
    deleteFinanceNews,
    deleteNewsSource,
    fetchFinanceNews,
    fetchNewsCollectLogs,
    fetchNewsSources,
    updateFinanceNews,
    updateNewsSource,
    type FinanceNewsItem,
    type NewsCollectLog,
    type NewsSource
  } from '@/api/system-manage'

  defineOptions({ name: 'SettingsNews' })

  const categories = [
    { label: '财经', value: 'FINANCE' },
    { label: '经济', value: 'ECONOMY' },
    { label: '7×24', value: 'FLASH' },
    { label: '商品', value: 'COMMODITY' },
    { label: '上市公司', value: 'LISTED_COMPANY' },
    { label: '央行', value: 'CENTRAL_BANK' },
    { label: 'A股', value: 'A_SHARE' },
    { label: '港股', value: 'HK_STOCK' },
    { label: '美股', value: 'US_STOCK' },
    { label: '行业资讯', value: 'INDUSTRY' },
    { label: '公司公告', value: 'ANNOUNCEMENT' },
    { label: '宏观政策', value: 'POLICY' },
    { label: '其他', value: 'OTHER' }
  ]

  const loading = ref(false)
  const collecting = ref(false)
  const collectingSourceId = ref<number | null>(null)
  const rows = ref<FinanceNewsItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const selected = ref<FinanceNewsItem[]>([])
  const sources = ref<NewsSource[]>([])
  const logs = ref<NewsCollectLog[]>([])
  const logPage = ref(1)
  const logPageSize = ref(10)
  const logTotal = ref(0)
  const filters = reactive({
    keyword: '',
    category: '',
    contentType: '',
    source: '',
    securityCode: '',
    status: '',
    publishedAt: [] as string[]
  })
  const sourceEditorVisible = ref(false)
  const sourceCreateVisible = ref(false)
  const sourceSaving = ref(false)
  const sourceCurrent = ref<NewsSource | null>(null)
  const sourceEdit = reactive({
    enabled: true,
    interval_seconds: 600,
    timeout_seconds: 30,
    rate_limit: 1,
    config_json: ''
  })
  const sourceCreate = reactive({
    name: '',
    source_type: 'api',
    base_url: '',
    enabled: true,
    interval_seconds: 600,
    timeout_seconds: 10,
    rate_limit: 20,
    config_json: '{"adapter":"gov_cn_pushinfo"}'
  })

  const searchItems = [
    { label: '关键词', key: 'keyword', type: 'input', props: { placeholder: '标题/摘要' } },
    {
      label: '分类',
      key: 'category',
      type: 'select',
      props: {
        placeholder: '全部分类',
        options: categories.map((item) => ({ label: item.label, value: item.value }))
      }
    },
    {
      label: '类型',
      key: 'contentType',
      type: 'select',
      props: {
        placeholder: '全部类型',
        options: [
          { label: '文章', value: 'article' },
          { label: '快讯', value: 'flash' },
          { label: '公告', value: 'announcement' }
        ]
      }
    },
    { label: '来源', key: 'source', type: 'input', props: { placeholder: '来源名称' } },
    {
      label: '证券代码',
      key: 'securityCode',
      type: 'input',
      props: { placeholder: '例如：600519' }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '全部状态',
        options: [
          { label: '已发布', value: 'published' },
          { label: '草稿', value: 'draft' },
          { label: '隐藏', value: 'hidden' }
        ]
      }
    },
    {
      label: '发布时间',
      key: 'publishedAt',
      type: 'datetimerange',
      props: {
        type: 'datetimerange',
        valueFormat: 'X',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间'
      }
    }
  ]

  const loadNews = async () => {
    loading.value = true
    try {
      const { publishedAt, ...queryFilters } = filters
      const [startTime, endTime] = publishedAt
      const data = await fetchFinanceNews({
        page: page.value,
        pageSize: pageSize.value,
        ...queryFilters,
        startTime,
        endTime
      })
      rows.value = data.records
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  const loadSources = async () => {
    sources.value = await fetchNewsSources()
  }

  const loadLogs = async () => {
    const data = await fetchNewsCollectLogs({ page: logPage.value, pageSize: logPageSize.value })
    logs.value = data.records
    logTotal.value = data.total
  }

  const loadAll = async () => {
    await Promise.all([loadNews(), loadSources(), loadLogs()])
  }

  const search = () => {
    page.value = 1
    loadNews()
  }

  const reset = () => {
    Object.assign(filters, {
      keyword: '',
      category: '',
      contentType: '',
      source: '',
      securityCode: '',
      status: '',
      publishedAt: []
    })
    page.value = 1
    loadNews()
  }

  const onSelectionChange = (values: FinanceNewsItem[]) => {
    selected.value = values
  }

  const collectAll = async () => {
    collecting.value = true
    try {
      const result = await collectFinanceNews()
      ElMessage.success(`采集完成：拉取 ${result.fetched_count || result.FetchedCount || 0} 条`)
      await loadAll()
    } finally {
      collecting.value = false
    }
  }

  const collectOne = async (sourceId: number) => {
    collectingSourceId.value = sourceId
    try {
      await collectFinanceNews(sourceId)
      ElMessage.success('单源采集完成')
      await loadAll()
    } finally {
      collectingSourceId.value = null
    }
  }

  const toggleSource = async (row: NewsSource) => {
    await updateNewsSource({ id: row.id, enabled: !row.enabled })
    ElMessage.success('新闻源状态已更新')
    await loadSources()
  }

  const openSourceEdit = (row: NewsSource) => {
    sourceCurrent.value = row
    Object.assign(sourceEdit, {
      enabled: row.enabled,
      interval_seconds: row.interval_seconds || 600,
      timeout_seconds: row.timeout_seconds || 30,
      rate_limit: row.rate_limit || 1,
      config_json: row.config_json || ''
    })
    sourceEditorVisible.value = true
  }

  const openSourceCreate = () => {
    Object.assign(sourceCreate, {
      name: '',
      source_type: 'api',
      base_url: '',
      enabled: true,
      interval_seconds: 600,
      timeout_seconds: 10,
      rate_limit: 20,
      config_json: '{"adapter":"gov_cn_pushinfo"}'
    })
    sourceCreateVisible.value = true
  }

  const saveSourceCreate = async () => {
    if (
      !sourceCreate.name.trim() ||
      !sourceCreate.source_type.trim() ||
      !sourceCreate.base_url.trim()
    ) {
      ElMessage.warning('请填写新闻源名称、类型和地址')
      return
    }
    sourceSaving.value = true
    try {
      await createNewsSource(sourceCreate)
      ElMessage.success('新闻源已新增')
      sourceCreateVisible.value = false
      await loadSources()
    } finally {
      sourceSaving.value = false
    }
  }

  const removeSource = async (row: NewsSource) => {
    await ElMessageBox.confirm(
      `确定删除新闻源「${row.name}」吗？删除后不会再参与自动采集。`,
      '删除新闻源',
      { type: 'warning' }
    )
    await deleteNewsSource(row.id)
    ElMessage.success('新闻源已删除')
    await loadSources()
  }

  const saveSourceEdit = async () => {
    if (!sourceCurrent.value) return
    sourceSaving.value = true
    try {
      await updateNewsSource({ id: sourceCurrent.value.id, ...sourceEdit })
      ElMessage.success('新闻源已更新')
      sourceEditorVisible.value = false
      await loadSources()
    } finally {
      sourceSaving.value = false
    }
  }

  const toggleTop = async (row: FinanceNewsItem) => {
    await updateFinanceNews({ id: row.id, is_top: !row.is_top })
    ElMessage.success('置顶状态已更新')
    await loadNews()
  }

  const remove = async (row: FinanceNewsItem) => {
    await ElMessageBox.confirm(`确定删除新闻「${row.title}」吗？`, '删除新闻', { type: 'warning' })
    await deleteFinanceNews(row.id)
    ElMessage.success('新闻已删除')
    await loadNews()
  }

  const batchHide = async () => {
    await batchFinanceNewsAction({ action: 'hide', ids: selected.value.map((item) => item.id) })
    ElMessage.success('已批量隐藏')
    await loadNews()
  }

  const batchDelete = async () => {
    await ElMessageBox.confirm('确定批量删除选中新闻吗？', '批量删除', { type: 'warning' })
    await batchFinanceNewsAction({ action: 'delete', ids: selected.value.map((item) => item.id) })
    ElMessage.success('已批量删除')
    await loadNews()
  }

  const openSource = (url: string) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const editorVisible = ref(false)
  const current = ref<FinanceNewsItem | null>(null)
  const edit = reactive({ title: '', category: 'OTHER', summary: '', status: 'published' })

  const openEdit = (row: FinanceNewsItem) => {
    current.value = row
    Object.assign(edit, {
      title: row.title || '',
      category: row.category || 'OTHER',
      summary: row.summary || '',
      status: row.status || 'published'
    })
    editorVisible.value = true
  }

  const saveEdit = async () => {
    if (!current.value) return
    if (!edit.title.trim()) {
      ElMessage.warning('请填写新闻标题')
      return
    }
    await updateFinanceNews({
      id: current.value.id,
      title: edit.title,
      category: edit.category,
      summary: edit.summary,
      status: edit.status
    })
    ElMessage.success('新闻已更新')
    editorVisible.value = false
    await loadNews()
  }

  const toggleStatus = async (row: FinanceNewsItem) => {
    const status = row.status === 'hidden' ? 'published' : 'hidden'
    const action = status === 'published' ? '上架' : '下架'
    await ElMessageBox.confirm(`确定${action}新闻「${row.title}」吗？`, `${action}新闻`, {
      type: 'warning'
    })
    await updateFinanceNews({ id: row.id, status })
    ElMessage.success(`新闻已${action}`)
    await loadNews()
  }

  const time = (value?: number) => {
    if (!value) return '--'
    return new Date(value * 1000).toLocaleString('zh-CN', { hour12: false })
  }

  onMounted(loadAll)
</script>

<style scoped>
  .news-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: auto;
    min-height: var(--art-full-height);
    padding-bottom: 28px;
    overflow: visible;
  }

  .art-table-card {
    flex: none;

    :deep(.el-card__body) {
      height: auto;
      overflow: visible;
    }
  }

  .source-card,
  .log-card {
    flex: none;
  }

  .card-title {
    font-weight: 600;
  }

  .pager {
    display: flex;
    gap: 14px;
    align-items: center;
    justify-content: flex-end;
    padding-top: 14px;
  }

  .danger {
    color: var(--el-color-danger);
  }
</style>
