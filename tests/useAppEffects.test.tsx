import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

const {
  checkSystemUpdateMock,
  readStoredUpdateFeedbackMock,
  initPixelBlastBackgroundMock,
} = vi.hoisted(() => ({
  checkSystemUpdateMock: vi.fn(),
  readStoredUpdateFeedbackMock: vi.fn(),
  initPixelBlastBackgroundMock: vi.fn(() => undefined),
}));

vi.mock('../src/services/update', () => ({
  checkSystemUpdate: checkSystemUpdateMock,
  readStoredUpdateFeedback: readStoredUpdateFeedbackMock,
}));

vi.mock('../src/lib/pixelBlastBackground', () => ({
  initPixelBlastBackground: initPixelBlastBackgroundMock,
}));

import { useAppEffects } from '../src/app/useAppEffects';

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function setVisibilityState(value: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value,
  });
}

function createArgs(overrides: Partial<Parameters<typeof useAppEffects>[0]> = {}) {
  return {
    language: 'en',
    toasts: [],
    dismissToast: vi.fn(),
    loadInitialServers: vi.fn().mockResolvedValue(undefined),
    refreshWorkflows: vi.fn().mockResolvedValue(undefined),
    pushToast: vi.fn(),
    setUpdateInfo: vi.fn(),
    setUpdateFeedback: vi.fn(),
    t: vi.fn((key: string) => key),
    isEditorRoute: false,
    hasUnsavedChanges: false,
    confirmOpen: false,
    serverModalOpen: false,
    transferModalOpen: false,
    editorQuery: '',
    clearEditorQuery: vi.fn(),
    mappingSearchRef: createRef<HTMLInputElement>(),
    saveWorkflow: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function Harness(props: { args: Parameters<typeof useAppEffects>[0] }) {
  useAppEffects(props.args);
  return null;
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useAppEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.scrollTo = vi.fn();
    setVisibilityState('visible');
    checkSystemUpdateMock.mockResolvedValue({ has_update: false });
    readStoredUpdateFeedbackMock.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not schedule workflow polling on editor routes', async () => {
    const args = createArgs({ isEditorRoute: true });

    render(<Harness args={args} />);
    await flushMicrotasks();

    expect(args.refreshWorkflows).toHaveBeenCalledTimes(1);
    vi.mocked(args.refreshWorkflows).mockClear();

    act(() => {
      vi.advanceTimersByTime(20_000);
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flushMicrotasks();

    expect(args.refreshWorkflows).not.toHaveBeenCalled();
  });

  it('refreshes workflows without overlapping requests and reacts to focus', async () => {
    const firstRefresh = createDeferred<void>();
    const args = createArgs({
      refreshWorkflows: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockImplementationOnce(() => firstRefresh.promise)
        .mockResolvedValue(undefined),
    });

    render(<Harness args={args} />);
    await flushMicrotasks();

    expect(args.refreshWorkflows).toHaveBeenCalledTimes(1);
    vi.mocked(args.refreshWorkflows).mockClear();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(args.refreshWorkflows).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(15_000);
      window.dispatchEvent(new Event('focus'));
    });
    expect(args.refreshWorkflows).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstRefresh.resolve();
      await Promise.resolve();
    });

    expect(args.refreshWorkflows).toHaveBeenCalledTimes(2);

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await flushMicrotasks();

    expect(args.refreshWorkflows).toHaveBeenCalledTimes(3);
  });

  it('loads stored update feedback and skips the delayed update check', async () => {
    const feedback = { status: 'success' as const, message: 'Updated.' };
    readStoredUpdateFeedbackMock.mockReturnValue(feedback);
    const args = createArgs();

    render(<Harness args={args} />);
    await flushMicrotasks();

    expect(args.setUpdateFeedback).toHaveBeenCalledWith(feedback);

    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    await flushMicrotasks();

    expect(checkSystemUpdateMock).not.toHaveBeenCalled();
  });
});
