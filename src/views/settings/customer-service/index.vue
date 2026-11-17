<template>
  <ElCard class="customer-service-page">
    <h2>米多客客服设置</h2>
    <ElAlert
      title="填写米多客生成的访客咨询链接，不是客服工作台登录地址"
      description="客户在前端点击客服后会打开这个链接。客服人员登录米多客工作台接待和回复；本站后台不收发聊天消息。"
      type="info"
      show-icon
      :closable="false"
    />
    <ElForm label-position="top" @submit.prevent="save">
      <ElFormItem label="米多客访客聊天链接">
        <ElInput
          v-model="link"
          :disabled="loading || saving"
          :maxlength="4096"
          placeholder="粘贴米多客提供的完整 https:// 访客链接"
          clearable
        />
      </ElFormItem>
      <p
        >保存后，首页、我的、充值/提现、实名认证及人脸采集页的客服入口统一使用此链接。留空保存可暂停跳转。</p
      >
      <p
        >本页复用已有客服链接配置，不改变行情、交易等其他设置。不会向米多客自动传送客户手机号、银行卡或认证材料。</p
      >
      <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon />
      <div class="customer-service-actions">
        <ElButton type="primary" native-type="submit" :loading="saving" :disabled="loading"
          >保存设置</ElButton
        >
        <ElButton :loading="loading" :disabled="saving" @click="load">重新读取</ElButton>
        <ElButton
          v-if="savedLink"
          tag="a"
          :href="savedLink"
          target="_blank"
          rel="noopener noreferrer"
          >测试已保存链接</ElButton
        >
      </div>
    </ElForm>
  </ElCard>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { fetchCustomerService, saveCustomerService } from '@/api/customer-service'

  defineOptions({ name: 'SettingsCustomerService' })
  const link = ref('')
  const savedLink = ref('')
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const data = await fetchCustomerService()
      link.value = savedLink.value = data.url
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '读取客服设置失败'
    } finally {
      loading.value = false
    }
  }

  async function save() {
    if (loading.value || saving.value) return
    saving.value = true
    error.value = ''
    try {
      const data = await saveCustomerService({ url: link.value.trim() })
      link.value = savedLink.value = data.url
      ElMessage.success(data.url ? '米多客访客链接已保存' : '客服跳转已暂停')
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '保存客服设置失败'
    } finally {
      saving.value = false
    }
  }

  onMounted(load)
</script>

<style scoped>
  .customer-service-page h2 {
    margin-bottom: 20px;
  }

  .customer-service-page form {
    max-width: 900px;
    margin-top: 24px;
  }

  .customer-service-page p {
    margin: 12px 0;
    line-height: 1.8;
    color: var(--el-text-color-secondary);
  }

  .customer-service-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  .customer-service-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }
</style>
