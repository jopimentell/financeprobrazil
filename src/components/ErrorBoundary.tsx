import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {this.props.fallbackMessage || 'Ocorreu um erro inesperado. Tente recarregar a página.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input text-sm font-medium hover:bg-accent"
            >
              Ir para Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
