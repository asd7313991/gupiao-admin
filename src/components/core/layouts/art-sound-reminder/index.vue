<template>
  <Teleport to="body">
    <aside class="sound-reminder" aria-label="提示音设置">
      <header class="sound-heading">
        <strong>提示音设置</strong>
        <ElButton
          text
          size="small"
          :aria-expanded="!collapsed"
          aria-controls="sound-reminder-content"
          @click="collapsed = !collapsed"
          >{{ collapsed ? '展开' : '收起' }}</ElButton
        >
      </header>
      <div v-show="!collapsed" id="sound-reminder-content">
        <div class="sound-master">
          <span>{{ sounds.enabled ? '本标签页声音已开启' : '本标签页声音未开启' }}</span>
          <ElButton size="small" :type="sounds.enabled ? 'default' : 'primary'" @click="toggle">
            {{ sounds.enabled ? '静音' : '开启声音' }}
          </ElButton>
        </div>
        <div class="sound-options">
          <div v-for="row in sounds.rows" :key="row.kind" class="sound-option">
            <span>{{ soundLabels[row.kind] }}提示音</span>
            <ElTag size="small" :type="row.audio_hash && row.enabled ? 'success' : 'info'">
              {{ !row.audio_hash ? '未上传' : row.enabled ? '已开启' : '已关闭' }}
            </ElTag>
            <ElButton
              size="small"
              :type="row.enabled ? 'primary' : 'default'"
              :loading="sounds.savingKind === row.kind"
              :disabled="sounds.savingKind !== null || !row.audio_hash || !!sounds.error"
              :aria-label="`${row.enabled ? '关闭' : '开启'}${soundLabels[row.kind]}提示音`"
              @click="sounds.setEnabled(row.kind, !row.enabled)"
              >{{ row.enabled ? '关闭' : '开启' }}</ElButton
            >
          </div>
        </div>
        <p v-if="!sounds.rows.length && !sounds.error">
          {{ sounds.loading ? '正在读取提示音设置…' : '暂无提示音配置，请刷新重试' }}
        </p>
        <p class="sound-hint">业务开关全后台共用；本标签页需点击“开启声音”。</p>
        <footer class="sound-actions">
          <ElButton size="small" @click="router.push('/settings/sounds')">音频管理</ElButton>
          <ElButton size="small" :loading="sounds.loading" @click="sounds.refresh">刷新</ElButton>
        </footer>
      </div>
      <p v-if="failure" class="sound-error" role="alert">{{ failure }}</p>
      <p v-else-if="collapsed" class="sound-hint">
        {{ sounds.enabled ? '声音已开启' : '声音未开启' }} · 展开可设置四类提醒
      </p>
      <p v-else-if="sounds.lastNotice" class="sound-notice" role="status">{{
        sounds.lastNotice
      }}</p>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useNotificationSoundStore } from '@/store/modules/notification-sounds'
  import { soundLabels } from '@/api/notification-sounds'

  const router = useRouter()
  const sounds = useNotificationSoundStore()
  const collapsed = ref(false)
  const failure = computed(() => sounds.error || sounds.playbackError || sounds.settingsError)
  const toggle = () => (sounds.enabled ? sounds.mute() : void sounds.enable())
  onMounted(sounds.start)
  onBeforeUnmount(sounds.stop)
</script>

<style scoped>
  .sound-reminder {
    position: fixed;
    right: max(16px, env(safe-area-inset-right));
    bottom: max(16px, env(safe-area-inset-bottom));
    z-index: 1000;
    box-sizing: border-box;
    width: 320px;
    max-width: calc(100vw - 32px);
    max-height: calc(100dvh - 32px);
    padding: 14px 16px;
    overflow-y: auto;
    font-size: 13px;
    color: var(--el-text-color-primary);
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-darker);
    border-radius: 12px;
    box-shadow: var(--el-box-shadow-light);
  }

  .sound-heading,
  .sound-master,
  .sound-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .sound-heading strong {
    font-size: 16px;
  }

  .sound-master {
    padding-bottom: 12px;
    margin: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .sound-options {
    display: grid;
    gap: 12px;
  }

  .sound-option {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 58px 60px;
    gap: 8px;
    align-items: center;
  }

  .sound-option > span:first-child {
    overflow-wrap: anywhere;
  }

  .sound-option :deep(.el-tag) {
    justify-self: start;
  }

  .sound-reminder p {
    margin: 12px 0 0;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .sound-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .sound-actions {
    justify-content: flex-start;
    margin-top: 12px;
  }

  .sound-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  .sound-error {
    color: var(--el-color-danger);
  }
</style>
