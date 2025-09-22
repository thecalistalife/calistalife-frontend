import { useToastStore } from '../store/toast';

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[260px] max-w-sm px-4 py-3 rounded shadow-lg text-white ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-black'
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm leading-snug">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-80 hover:opacity-100">×</button>
          </div>
        </div>
      ))}
    </div>
  );
}