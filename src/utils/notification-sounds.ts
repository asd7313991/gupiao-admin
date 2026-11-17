import type { NotificationSound, SoundKind } from '../api/notification-sounds'

export function collectNewSounds(
  previous: Map<SoundKind, number>,
  rows: NotificationSound[]
): SoundKind[] {
  const changed: SoundKind[] = []
  for (const row of rows) {
    const last = previous.get(row.kind)
    previous.set(row.kind, row.revision)
    if (last !== undefined && row.revision > last && row.enabled && row.audio_hash) {
      changed.push(row.kind)
    }
  }
  return changed
}

export async function decodeNotificationSound(context: AudioContext, data: ArrayBuffer) {
  const buffer = await context.decodeAudioData(data)
  if (!Number.isFinite(buffer.duration) || buffer.duration <= 0 || buffer.duration > 30) {
    throw new Error('提示音时长须在 0 至 30 秒之间')
  }
  return buffer
}
