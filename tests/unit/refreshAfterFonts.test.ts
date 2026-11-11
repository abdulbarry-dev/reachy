import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `refreshAfterFonts` exists because several sections ask for the same refresh
 * at mount. The contract: one refresh per font load, no matter how many callers
 * ask while the face is still loading, and none at all when the environment has
 * no `document.fonts` (SSR, older jsdom).
 */

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock('../../src/lib/gsap', () => ({ ScrollTrigger: { refresh } }))

type Deferred = {
  promise: Promise<void>
  resolve: () => void
}

function deferred(): Deferred {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

async function loadModuleWithFonts(ready: Promise<void> | undefined) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: ready ? { ready } : undefined,
  })

  return import('../../src/lib/scroll')
}

/** Lets the promise callbacks queued by the module run. */
async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  vi.resetModules()
  refresh.mockClear()
  // Run the deferred refresh inline: the frame boundary is not under test.
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 0
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document, 'fonts')
})

describe('refreshAfterFonts', () => {
  it('coalesces every caller waiting on the same font load into one refresh', async () => {
    const fonts = deferred()
    const { refreshAfterFonts } = await loadModuleWithFonts(fonts.promise)

    refreshAfterFonts()
    refreshAfterFonts()
    refreshAfterFonts()

    expect(refresh).not.toHaveBeenCalled()

    fonts.resolve()
    await fonts.promise
    await flush()

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('arms again for a later font load once the first refresh has run', async () => {
    const fonts = deferred()
    const { refreshAfterFonts } = await loadModuleWithFonts(fonts.promise)

    refreshAfterFonts()
    fonts.resolve()
    await fonts.promise
    await flush()
    expect(refresh).toHaveBeenCalledTimes(1)

    refreshAfterFonts()
    await flush()

    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('does nothing when the environment exposes no font set', async () => {
    const { refreshAfterFonts } = await loadModuleWithFonts(undefined)

    expect(() => refreshAfterFonts()).not.toThrow()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('cancels a refresh still waiting on the font when the caller goes away', async () => {
    const fonts = deferred()
    const { refreshAfterFonts } = await loadModuleWithFonts(fonts.promise)

    const cancel = refreshAfterFonts()
    cancel()

    fonts.resolve()
    await fonts.promise
    await flush()

    expect(refresh).not.toHaveBeenCalled()
  })

  it('cancels a refresh already queued for the next frame', async () => {
    const fonts = deferred()
    const { refreshAfterFonts } = await loadModuleWithFonts(fonts.promise)

    // Hold the frame so the refresh is pending when the caller cancels.
    let frame: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frame = callback
      return 7
    })
    const cancelFrame = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancelFrame)

    const cancel = refreshAfterFonts()
    fonts.resolve()
    await fonts.promise
    await flush()

    cancel()
    frame?.(0)

    expect(cancelFrame).toHaveBeenCalledWith(7)
    expect(refresh).not.toHaveBeenCalled()
  })
})
