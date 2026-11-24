import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __HA1_APP_MOUNTED__?: boolean;
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Đã xảy ra lỗi khi khởi tạo ứng dụng.',
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('HA1 Exam Pro runtime error:', error, info);
  }

  private handleResetAndReload = () => {
    try {
      window.localStorage.removeItem('ha1_exam_pro_v1_draft');
      window.localStorage.removeItem('ha1_exam_pro_v1_custom_exams');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4 text-center">
            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Không thể hiển thị giao diện
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={this.handleResetAndReload}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
            >
              Xóa dữ liệu tạm &amp; Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

window.__HA1_APP_MOUNTED__ = true;

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
