import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[240px] p-6 rounded-2xl bg-[#0e1233] border border-rose-500/30 text-white text-center shadow-xl m-4">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 mb-3">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-base font-black text-rose-200 mb-1">
            画面の読み込み中に問題が発生しました
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mb-4">
            {this.state.error?.message || '予期せぬエラーが発生しました'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>再試行する</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
