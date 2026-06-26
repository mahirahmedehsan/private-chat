import { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

let audioCtx

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

export function useSound() {
  const soundEnabled = useSelector((s) => s.ui.soundEnabled)
  const enabledRef = useRef(soundEnabled)
  enabledRef.current = soundEnabled

  const playRef = useRef()

  const play = useCallback(async (notes) => {
    if (!enabledRef.current) return
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const now = ctx.currentTime
      for (const { freq, start, duration, volume = 0.15, type = 'sine' } of notes) {
        const osc = ctx.createOscillator()
        osc.type = type
        osc.frequency.setValueAtTime(freq, now + start)

        const noteGain = ctx.createGain()
        noteGain.gain.setValueAtTime(0, now + start)
        noteGain.gain.linearRampToValueAtTime(volume, now + start + 0.01)
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + start + duration)

        osc.connect(noteGain)
        noteGain.connect(ctx.destination)
        osc.start(now + start)
        osc.stop(now + start + duration + 0.05)
      }
    } catch {}
  }, [])

  playRef.current = play

  useEffect(() => {
    function init() {
      try {
        const ctx = getAudioContext()
        if (ctx.state === 'suspended') ctx.resume()
      } catch {}
    }
    document.addEventListener('click', init, { once: true })
    document.addEventListener('keydown', init, { once: true })
    return () => {
      document.removeEventListener('click', init)
      document.removeEventListener('keydown', init)
    }
  }, [])

  return {
    playMessageReceived: useCallback(() => {
      playRef.current?.([
        { freq: 520, start: 0, duration: 0.15, volume: 0.12 },
        { freq: 680, start: 0.12, duration: 0.2, volume: 0.12 },
      ])
    }, []),
    playMessageSent: useCallback(() => {
      playRef.current?.([
        { freq: 880, start: 0, duration: 0.08, volume: 0.08 },
        { freq: 660, start: 0.06, duration: 0.1, volume: 0.06 },
      ])
    }, []),
    playNotification: useCallback(() => {
      playRef.current?.([
        { freq: 440, start: 0, duration: 0.12, volume: 0.1 },
        { freq: 550, start: 0.1, duration: 0.12, volume: 0.1 },
        { freq: 660, start: 0.2, duration: 0.18, volume: 0.1 },
      ])
    }, []),
  }
}
