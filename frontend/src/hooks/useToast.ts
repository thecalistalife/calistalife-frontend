import { useToastStore } from '../store/toast';

export const useToast = () => {
  const show = useToastStore((s) => s.show);
  return {
    success: (msg: string) => show('success', msg),
    error: (msg: string) => show('error', msg),
    info: (msg: string) => show('info', msg),
  };
};