import assert from 'node:assert/strict'
import { test } from 'node:test'
import { collectNewSounds } from '../src/utils/notification-sounds'
import type { NotificationSound, SoundKind } from '../src/api/notification-sounds'

const row = (kind: SoundKind, revision: number, enabled = true): NotificationSound => ({
  kind,
  revision,
  enabled,
  filename: 'test.wav',
  audio_hash: 'test'
})

test('首次只记基线、重复轮询不响，各类新事件仅返回一次', () => {
  const baseline = new Map<SoundKind, number>()
  assert.deepEqual(collectNewSounds(baseline, [row('recharge', 100), row('withdrawal', 20)]), [])
  assert.deepEqual(collectNewSounds(baseline, [row('recharge', 100), row('withdrawal', 20)]), [])
  assert.deepEqual(collectNewSounds(baseline, [row('recharge', 103), row('withdrawal', 21)]), [
    'recharge',
    'withdrawal'
  ])
  assert.deepEqual(collectNewSounds(baseline, [row('recharge', 103), row('withdrawal', 21)]), [])
  assert.deepEqual(collectNewSounds(baseline, [row('verification', 5), row('registration', 8)]), [])
  assert.deepEqual(collectNewSounds(baseline, [row('verification', 6), row('registration', 9)]), [
    'verification',
    'registration'
  ])
})

test('开关、音频替换、计数回退不会重播，静音期间也推进基线', () => {
  const baseline = new Map<SoundKind, number>()
  collectNewSounds(baseline, [row('verification', 1, false)])
  assert.deepEqual(collectNewSounds(baseline, [row('verification', 4, false)]), [])
  assert.deepEqual(collectNewSounds(baseline, [row('verification', 4)]), [])
  assert.deepEqual(
    collectNewSounds(baseline, [{ ...row('verification', 4), audio_hash: 'replaced' }]),
    []
  )
  assert.deepEqual(collectNewSounds(baseline, [row('verification', 2)]), [])
  assert.deepEqual(collectNewSounds(baseline, [row('verification', 3)]), ['verification'])
  assert.deepEqual(collectNewSounds(baseline, [{ ...row('verification', 5), audio_hash: '' }]), [])
})
