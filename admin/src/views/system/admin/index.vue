<template>
  <div class="admin-page art-full-height">
    <ElCard class="art-table-card">
      <ArtTableHeader>
        <template #left><ElButton disabled>新增管理员</ElButton></template>
      </ArtTableHeader>
      <ElTable :data="administrators">
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="name" label="管理员" min-width="160" />
        <ElTableColumn prop="account" label="登录账号" min-width="180" />
        <ElTableColumn prop="role" label="角色" min-width="160" />
        <ElTableColumn label="状态" width="100"
          ><template #default><ElTag type="success">启用</ElTag></template></ElTableColumn
        >
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }"
            ><ElDropdown trigger="click"
              ><ElButton text class="more">操作</ElButton
              ><template #dropdown
                ><ElDropdownMenu
                  ><ElDropdownItem @click="openPassword(row)">修改登录密码</ElDropdownItem
                  ><ElDropdownItem @click="resetSecret(row)"
                    >重置谷歌密钥</ElDropdownItem
                  ></ElDropdownMenu
                ></template
              ></ElDropdown
            ></template
          >
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="passwordVisible" title="修改管理员登录密码" width="420px"
      ><ElForm label-width="90px"
        ><ElFormItem label="管理员"><ElInput :model-value="current?.account" disabled /></ElFormItem
        ><ElFormItem label="新密码" required
          ><ElInput
            v-model="password.value"
            type="password"
            show-password
            placeholder="至少 6 位" /></ElFormItem
        ><ElFormItem label="确认密码" required
          ><ElInput v-model="password.confirm" type="password" show-password /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="passwordVisible = false">取消</ElButton
        ><ElButton type="primary" @click="savePassword">确定</ElButton></template
      ></ElDialog
    >
    <ElDialog v-model="secretVisible" title="Google 验证密钥已重置" width="500px"
      ><p class="notice">请立即保存以下密钥。启用 Google 验证后，管理员需使用该密钥绑定验证器。</p
      ><ElInput :model-value="secret" readonly
        ><template #append><ElButton @click="copySecret">复制</ElButton></template></ElInput
      ><p class="status">当前 Google 验证：{{ googleEnabled ? '已启用' : '未启用' }}</p
      ><template #footer
        ><ElButton type="primary" @click="secretVisible = false">已保存</ElButton></template
      ></ElDialog
    >
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    resetAdministratorGoogleAuthSecret,
    updateAdministratorPassword
  } from '@/api/system-manage'

  defineOptions({ name: 'AdministratorList' })

  const administrators = [{ id: 1, name: '超级管理员', account: 'admin', role: '超级管理员' }]
  const current = ref<(typeof administrators)[number] | null>(null)
  const passwordVisible = ref(false)
  const password = reactive({ value: '', confirm: '' })
  const secretVisible = ref(false)
  const secret = ref('')
  const googleEnabled = ref(false)

  const openPassword = (row: (typeof administrators)[number]) => {
    current.value = row
    Object.assign(password, { value: '', confirm: '' })
    passwordVisible.value = true
  }
  const savePassword = async () => {
    if (!current.value) return
    if (password.value.length < 6) return ElMessage.warning('密码至少 6 位')
    if (password.value !== password.confirm) return ElMessage.warning('两次输入的密码不一致')
    await updateAdministratorPassword({ id: current.value.id, password: password.value })
    ElMessage.success('管理员登录密码已修改')
    passwordVisible.value = false
  }
  const resetSecret = async (row: (typeof administrators)[number]) => {
    const result = await resetAdministratorGoogleAuthSecret(row.id)
    secret.value = result.secret
    googleEnabled.value = result.enabled
    secretVisible.value = true
  }
  const copySecret = async () => {
    await navigator.clipboard.writeText(secret.value)
    ElMessage.success('密钥已复制')
  }
</script>

<style scoped>
  .admin-page {
    height: 100%;
  }

  .more {
    min-width: 44px;
  }

  .notice {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 1.6;
  }

  .status {
    margin: 12px 0 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
