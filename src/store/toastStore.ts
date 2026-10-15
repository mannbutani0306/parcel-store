import { create } from 'zustand';

export interface StampToast {
  id: string;
  title: string;
  message?: string;
  badge?: string;
  variant?: 'stamp' | 'wax' | 'airmail' | 'tomato' | 'mint' | 'saffron';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: StampToast[];
  addToast: (toast: Omit<StampToast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: StampToast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-dismiss after 3.8s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3800);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
