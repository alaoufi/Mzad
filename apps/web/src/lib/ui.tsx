'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// نظام رسائل عصري بديل عن alert/confirm/prompt الأصلية — يُستدعى مباشرة من أي مكان.

type ToastType = 'info' | 'success' | 'error';
interface Toast { id: number; message: string; type: ToastType }
interface ConfirmDialog { kind: 'confirm'; message: string; title?: string; confirmText?: string; cancelText?: string; danger?: boolean; resolve: (v: boolean) => void }
interface PromptDialog { kind: 'prompt'; message: string; title?: string; defaultValue?: string; placeholder?: string; resolve: (v: string | null) => void }
type Dialog = ConfirmDialog | PromptDialog;

let toasts: Toast[] = [];
let dialog: Dialog | null = null;
const listeners = new Set<() => void>();
let seq = 1;
const emit = () => listeners.forEach((l) => l());

export function uiToast(message: string, type: ToastType = 'info') {
  const id = seq++;
  toasts = [...toasts, { id, message, type }];
  emit();
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit(); }, 3400);
}

export function uiConfirm(
  message: string,
  opts: { title?: string; confirmText?: string; cancelText?: string; danger?: boolean } = {},
): Promise<boolean> {
  return new Promise((resolve) => { dialog = { kind: 'confirm', message, ...opts, resolve }; emit(); });
}

export function uiPrompt(
  message: string,
  defaultValue = '',
  opts: { title?: string; placeholder?: string } = {},
): Promise<string | null> {
  return new Promise((resolve) => { dialog = { kind: 'prompt', message, defaultValue, ...opts, resolve }; emit(); });
}

export function UIHost() {
  const [, force] = useState(0);
  const [val, setVal] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  useEffect(() => { if (dialog?.kind === 'prompt') setVal(dialog.defaultValue ?? ''); }, [dialog]);

  if (!mounted) return null;

  const close = (result: boolean | string | null) => {
    const d = dialog;
    dialog = null;
    emit();
    if (d) (d.resolve as any)(result);
  };

  const toastStyle: Record<ToastType, string> = {
    info: 'bg-gray-900/90 text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
  };
  const toastIcon: Record<ToastType, string> = { info: 'ℹ️', success: '✅', error: '⚠️' };

  return createPortal(
    <>
      {/* التنبيهات */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[200] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id}
            className={`pointer-events-auto max-w-sm animate-fadeup rounded-2xl px-4 py-3 text-center text-sm font-bold shadow-xl ${toastStyle[t.type]}`}>
            {toastIcon[t.type]} {t.message}
          </div>
        ))}
      </div>

      {/* نافذة تأكيد/إدخال */}
      {dialog && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4" onClick={() => close(dialog!.kind === 'prompt' ? null : false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {dialog.title && <h3 className="mb-2 text-lg font-extrabold text-engrave">{dialog.title}</h3>}
            <p className="text-gray-700">{dialog.message}</p>

            {dialog.kind === 'prompt' && (
              <input autoFocus className="input mt-3" placeholder={dialog.placeholder} value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') close(val); }} />
            )}

            <div className="mt-5 flex gap-2">
              <button onClick={() => close(dialog!.kind === 'prompt' ? null : false)}
                className="btn-outline flex-1">
                {dialog.kind === 'confirm' ? (dialog.cancelText ?? 'إلغاء') : 'إلغاء'}
              </button>
              <button onClick={() => close(dialog!.kind === 'prompt' ? val : true)}
                className={`flex-1 ${dialog.kind === 'confirm' && dialog.danger ? 'btn-gold !bg-red-600' : 'btn-primary'}`}
                style={dialog.kind === 'confirm' && dialog.danger ? { backgroundImage: 'linear-gradient(135deg,#ef4444,#b91c1c)' } : undefined}>
                {dialog.kind === 'confirm' ? (dialog.confirmText ?? 'تأكيد') : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
