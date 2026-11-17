import request from '@/utils/http'

export const soundLabels = {
  recharge: '充值申请',
  withdrawal: '提现申请',
  verification: '实名提交',
  registration: '客户注册'
} as const

export type SoundKind = keyof typeof soundLabels

export interface NotificationSound {
  kind: SoundKind
  revision: number
  enabled: boolean
  filename: string
  audio_hash: string
}

const url = '/server-api/private/admin/platform/setting/sounds'

export function fetchNotificationSounds() {
  return request.get<NotificationSound[]>({ url, showErrorMessage: false })
}

export function fetchNotificationAudio(kind: SoundKind) {
  return request.get<{ data: string; content_type: string; audio_hash: string }>({
    url: `${url}/${kind}`,
    showErrorMessage: false
  })
}

export function uploadNotificationSound(kind: SoundKind, file: File) {
  const data = new FormData()
  data.append('file', file)
  return request.post<void>({ url: `${url}/${kind}`, data, showErrorMessage: false })
}

export function setNotificationSoundEnabled(kind: SoundKind, enabled: boolean) {
  return request.put<void>({
    url: `${url}/${kind}`,
    params: { enabled },
    showErrorMessage: false
  })
}
