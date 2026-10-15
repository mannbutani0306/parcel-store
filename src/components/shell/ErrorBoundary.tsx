import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Stamp, Button } from '../ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in postal dispatch:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F3EBDD] text-[#14231C] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] p-6 sm:p-8 shadow-[5px_5px_0_#14231C] text-center space-y-6">
            <div className="inline-block">
              <Stamp text="STATION HALTED" subtext="SIGNAL ERROR" variant="tomato" size="lg" rotation={-3} />
            </div>

            <div className="space-y-2">
              <h1 className="font-fraunces text-2xl sm:text-3xl font-semibold text-[#14231C]">
                Carriage Derailment
              </h1>
              <p className="text-xs sm:text-sm text-[#14231C]/75 font-sans leading-relaxed">
                A temporary disturbance occurred in the postal sorting engine. Our telegraph lines have registered this exception.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#F3EBDD] border border-[#14231C]/20 rounded-[10px] p-3 text-left font-mono text-[11px] text-[#E8502B] max-h-28 overflow-y-auto break-all">
                {this.state.error.message || 'Unknown dispatch failure'}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" size="md" onClick={this.handleReload}>
                🔄 Reload Station
              </Button>
              <Button variant="secondary" size="md" onClick={this.handleHome}>
                📬 Return to Storefront
              </Button>
            </div>

            <p className="font-label-mono text-[10px] text-[#14231C]/50 uppercase tracking-widest">
              General Post Office · Emergency Station Registry
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
