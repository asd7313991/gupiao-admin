<template>
  <div class="setting-grid">
    <div v-for="field in fields" :key="field.key" class="setting-item">
      <div class="field-copy"><span>{{ field.label }}</span><small v-if="field.hint">{{ field.hint }}</small></div>
      <div class="field-control">
        <template v-if="editing">
          <ElSwitch v-if="field.type === 'boolean'" v-model="data[field.key]" inline-prompt active-text="是" inactive-text="否" />
          <ElTimePicker v-else-if="field.type === 'time'" v-model="data[field.key]" format="HH:mm:ss" value-format="HH:mm:ss" />
          <ElInputNumber v-else-if="field.type === 'number'" v-model="data[field.key]" controls-position="right" />
          <ElInput v-else v-model="data[field.key]" />
        </template>
        <template v-else>
          <ElTag v-if="field.type === 'boolean'" :type="data[field.key] ? 'success' : 'info'" effect="light">{{ data[field.key] ? '已开启' : '已关闭' }}</ElTag>
          <span v-else class="display-value">{{ display(data[field.key], field.type) }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Field { key: string; label: string; type: 'number' | 'text' | 'time' | 'boolean'; hint?: string }
  defineProps<{ editing: boolean; data: Record<string, any>; fields: readonly Field[] }>()
  const display = (value: unknown, type: string) => {
    if (value === undefined || value === null || value === '') return '--'
    if (type === 'number' && typeof value === 'number') return value.toLocaleString('zh-CN', { maximumFractionDigits: 6 })
    return String(value)
  }
</script>

<style scoped>
.setting-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 28px;padding:6px 18px 18px}.setting-item{display:grid;grid-template-columns:minmax(126px,40%) 1fr;align-items:center;gap:12px;min-height:54px;border-bottom:1px solid var(--el-border-color-lighter)}.field-copy{display:flex;flex-direction:column;gap:3px;color:var(--el-text-color-primary);font-size:13px}.field-copy small{color:var(--el-text-color-secondary);font-size:11px;line-height:1.4}.field-control{min-width:0;text-align:right}.display-value{display:inline-block;max-width:100%;overflow:hidden;color:var(--el-text-color-regular);line-height:28px;text-overflow:ellipsis;vertical-align:middle;white-space:nowrap}:deep(.el-input),:deep(.el-input-number),:deep(.el-time-picker){width:100%}:deep(.el-input-number .el-input__inner){text-align:right}@media(max-width:900px){.setting-grid{grid-template-columns:1fr}.setting-item{grid-template-columns:42% 1fr}}
</style>
