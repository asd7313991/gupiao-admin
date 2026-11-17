<template>
  <div class="sounds-page">
    <ElCard>
      <h2>业务声音提醒</h2>
      <p>
        充值申请、提现申请、实名提交、客户注册有新记录时提醒。后台任意页面约每10秒检查一次，
        首次进入不补播旧记录；同一批同类记录只响一次。审核和删除不会触发提醒。
      </p>
      <ElAlert
        title="须先点击“开启声音”。后台关闭、设备休眠或浏览器限制后台运行时，无法保证声音及时播放。每个标签页需单独开启。"
        type="warning"
        :closable="false"
      />
      <div class="sound-controls">
        <ElButton type="primary" @click="sounds.enable">开启声音（播放测试声）</ElButton>
        <ElButton @click="sounds.mute">本页静音</ElButton>
        <ElButton :loading="sounds.loading" @click="sounds.refresh">刷新配置</ElButton>
        <ElTag>{{ sounds.enabled ? '当前标签页已开启' : '当前标签页静音' }}</ElTag>
      </div>
      <ElAlert
        v-if="sounds.error || sounds.playbackError || sounds.settingsError || error"
        :title="sounds.error || sounds.playbackError || sounds.settingsError || error"
        type="error"
        :closable="false"
      />
      <p
        >音频保存在数据库，更新部署不会丢失。支持 MP3 /
        WAV，每个文件不超过2MB、时长不超过30秒。上传后请开启对应业务的开关。</p
      >
      <div class="sound-list">
        <section v-for="row in sounds.rows" :key="row.kind" class="sound-row">
          <div class="sound-description">
            <strong>{{ soundLabels[row.kind] }}</strong>
            <span>{{ row.filename || '尚未上传提示音' }}</span>
          </div>
          <ElSwitch
            :model-value="row.enabled"
            :disabled="busy !== null || sounds.savingKind !== null || !row.audio_hash"
            active-text="启用"
            @change="sounds.setEnabled(row.kind, !row.enabled)"
          />
          <ElButton :disabled="busy !== null || !row.audio_hash" @click="sounds.preview(row.kind)"
            >试听</ElButton
          >
          <label class="sound-upload">
            {{ busy === row.kind ? '正在保存…' : row.audio_hash ? '更换音频' : '上传音频' }}
            <input
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
              :disabled="busy !== null || sounds.savingKind !== null"
              @change="upload(row.kind, $event)"
            />
          </label>
        </section>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { soundLabels, uploadNotificationSound, type SoundKind } from '@/api/notification-sounds'
  import { useNotificationSoundStore } from '@/store/modules/notification-sounds'
  import { decodeNotificationSound } from '@/utils/notification-sounds'

  defineOptions({ name: 'SettingsSounds' })
  const sounds = useNotificationSoundStore()
  const busy = ref<SoundKind | null>(null)
  const error = ref('')

  async function upload(kind: SoundKind, event: Event) {
    const input = event.target
    if (!(input instanceof HTMLInputElement)) return
    const file = input.files?.[0]
    if (!file || busy.value || sounds.savingKind !== null) return
    busy.value = kind
    error.value = ''
    let context: AudioContext | undefined
    try {
      if (file.size === 0 || file.size > 2 * 1024 * 1024) throw new Error('请选择不超过2MB的音频')
      context = new AudioContext()
      await decodeNotificationSound(context, await file.arrayBuffer())
      await uploadNotificationSound(kind, file)
      await sounds.reload()
      ElMessage.success('提示音已保存，请试听并检查业务开关')
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '上传提示音失败'
    } finally {
      busy.value = null
      input.value = ''
      if (context)
        await context.close().catch((cause) => {
          error.value = String(cause)
        })
    }
  }

  onMounted(() => void sounds.refresh())
</script>

<style scoped>
  .sounds-page p {
    margin: 14px 0;
    line-height: 1.8;
  }

  .sound-controls,
  .sound-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin: 16px 0;
  }

  .sound-row {
    padding: 16px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
  }

  .sound-description {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    min-width: 160px;
    overflow-wrap: anywhere;
  }

  .sound-upload {
    position: relative;
    padding: 8px 16px;
    overflow: hidden;
    color: var(--el-color-primary);
    cursor: pointer;
    border: 1px solid var(--el-color-primary);
    border-radius: 4px;
  }

  .sound-upload input {
    position: absolute;
    inset: 0;
    cursor: pointer;
    opacity: 0;
  }
</style>
