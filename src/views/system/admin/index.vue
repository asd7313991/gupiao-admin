<template>
  <div class="art-full-height">
    <ElCard class="art-table-card">
      <ArtTableHeader>
        <template #left><ElButton disabled>新增管理员</ElButton></template>
      </ArtTableHeader>
      <ElTable :data="administrators">
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="name" label="管理员" min-width="140" />
        <ElTableColumn prop="account" label="登录账号" min-width="160" />
        <ElTableColumn prop="role" label="角色" min-width="140" />
        <ElTableColumn label="状态" width="100"><template #default><ElTag type="success">启用</ElTag></template></ElTableColumn>
      </ElTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'AdministratorList' })

  const administrators = [{ id: 1, name: '超级管理员', account: 'admin', role: '超级管理员' }]
</script>
