import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchNotificationAudio,
  fetchNotificationSounds,
  setNotificationSoundEnabled,
  soundLabels,
  type NotificationSound,
  type SoundKind
} from '@/api/notification-sounds'
import { collectNewSounds, decodeNotificationSound } from '@/utils/notification-sounds'

export const useNotificationSoundStore = defineStore('notificationSounds', () => {
  const rows = ref<NotificationSound[]>([])
  const enabled = ref(false)
  const loading = ref(false)
  const error = ref('')
  const playbackError = ref('')
  const lastNotice = ref('')
  const savingKind = ref<SoundKind | null>(null)
  const settingsError = ref('')
  const previous = new Map<SoundKind, number>()
  const buffers = new Map<SoundKind, { hash: string; buffer: AudioBuffer }>()
  let context: AudioContext | undefined
  let source: AudioBufferSourceNode | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: Promise<void> | undefined
  let running = false
  let generation = 0
  let playbackGeneration = 0
  let draining = false
  let previewing = false
  let queue: SoundKind[] = []

  const message = (cause: unknown) =>
    cause instanceof Error ? cause.message : '声音提醒失败，请重试'

  function silence() {
    playbackGeneration++
    previewing = false
    queue = []
    source?.stop()
    source = undefined
  }

  async function audio(kind: SoundKind, ctx: AudioContext) {
    const config = rows.value.find((row) => row.kind === kind)
    const cached = buffers.get(kind)
    if (cached && cached.hash === config?.audio_hash) return cached.buffer
    const result = await fetchNotificationAudio(kind)
    const bytes = Uint8Array.from(atob(result.data), (character) => character.charCodeAt(0))
    const buffer = await decodeNotificationSound(ctx, bytes.buffer)
    if (ctx === context) buffers.set(kind, { hash: result.audio_hash, buffer })
    return buffer
  }

  async function play(kind: SoundKind, epoch: number) {
    const ctx = context
    if (!ctx || ctx.state !== 'running') {
      enabled.value = false
      throw new Error('浏览器暂停了声音，请点击“开启声音”后重试')
    }
    const buffer = await audio(kind, ctx)
    if (epoch !== playbackGeneration) return
    await new Promise<void>((resolve) => {
      const node = ctx.createBufferSource()
      source = node
      node.buffer = buffer
      node.connect(ctx.destination)
      node.onended = () => {
        node.disconnect()
        if (source === node) source = undefined
        resolve()
      }
      node.start()
    })
  }

  async function drain() {
    if (draining || previewing) return
    draining = true
    try {
      while (queue.length && enabled.value && !previewing) {
        const kind = queue.shift()!
        if (!rows.value.find((row) => row.kind === kind)?.enabled) continue
        try {
          await play(kind, playbackGeneration)
        } catch (cause) {
          playbackError.value = `${soundLabels[kind]}：${message(cause)}`
        }
      }
    } finally {
      draining = false
    }
  }

  function refresh() {
    if (pending) return pending
    const epoch = generation
    loading.value = true
    pending = (async () => {
      try {
        const data = await fetchNotificationSounds()
        if (epoch !== generation) return
        rows.value = data
        error.value = ''
        const changed = collectNewSounds(previous, data)
        if (changed.length && enabled.value) {
          lastNotice.value = `收到新${changed.map((kind) => soundLabels[kind]).join('、')}`
          queue = [...new Set([...queue, ...changed])]
          void drain()
        }
      } catch (cause) {
        if (epoch === generation) error.value = `声音提醒读取失败：${message(cause)}`
      } finally {
        loading.value = false
        pending = undefined
      }
    })()
    return pending
  }

  async function reload() {
    if (pending) await pending
    await refresh()
  }

  async function setEnabled(kind: SoundKind, value: boolean) {
    if (savingKind.value !== null) return
    const epoch = generation
    savingKind.value = kind
    settingsError.value = ''
    try {
      await setNotificationSoundEnabled(kind, value)
      if (epoch !== generation) return
      const row = rows.value.find((item) => item.kind === kind)
      if (row) row.enabled = value
      await reload()
    } catch (cause) {
      if (epoch === generation)
        settingsError.value = `保存${soundLabels[kind]}开关失败：${message(cause)}`
    } finally {
      savingKind.value = null
    }
  }

  async function poll(epoch: number) {
    await refresh()
    if (running && epoch === generation) timer = setTimeout(() => void poll(epoch), 10_000)
  }

  function start() {
    if (running) return
    running = true
    void poll(generation)
  }

  async function unlock() {
    context ??= new AudioContext()
    await context.resume()
    if (context.state !== 'running') throw new Error('浏览器未允许播放，请检查声音权限后重试')
  }

  async function enable() {
    try {
      await unlock()
      // 明确的用户点击内解锁音频，短提示声用于确认设备能播放。
      const oscillator = context!.createOscillator()
      const gain = context!.createGain()
      gain.gain.value = 0.03
      oscillator.connect(gain).connect(context!.destination)
      oscillator.onended = () => {
        oscillator.disconnect()
        gain.disconnect()
      }
      oscillator.start()
      oscillator.stop(context!.currentTime + 0.15)
      enabled.value = true
      playbackError.value = ''
    } catch (cause) {
      enabled.value = false
      playbackError.value = message(cause)
    }
  }

  function mute() {
    enabled.value = false
    silence()
  }

  async function preview(kind: SoundKind) {
    silence()
    previewing = true
    const epoch = playbackGeneration
    try {
      await unlock()
      playbackError.value = ''
      await play(kind, epoch)
    } catch (cause) {
      playbackError.value = `试听失败：${message(cause)}`
    } finally {
      if (epoch === playbackGeneration) {
        previewing = false
        void drain()
      }
    }
  }

  function stop() {
    running = false
    generation++
    if (timer) clearTimeout(timer)
    mute()
    previewing = false
    previous.clear()
    rows.value = []
    buffers.clear()
    lastNotice.value = ''
    error.value = ''
    settingsError.value = ''
    const ctx = context
    context = undefined
    if (ctx)
      void ctx.close().catch((cause) => {
        playbackError.value = message(cause)
      })
  }

  return {
    rows,
    enabled,
    loading,
    error,
    playbackError,
    lastNotice,
    savingKind,
    settingsError,
    setEnabled,
    start,
    stop,
    refresh,
    reload,
    enable,
    mute,
    preview
  }
})
