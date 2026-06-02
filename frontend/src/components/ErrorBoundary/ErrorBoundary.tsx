import React from "react";
import { Button } from "react-bootstrap";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  lastKey: string | undefined;
}

/**
 * Catches render-phase errors thrown by its child tree and shows a fallback UI, instead of letting the crash unmount the whole app (white screen).
 * Must be a class: React exposes the error-catching lifecycle methods (getDerivedStateFromError / componentDidCatch) only to class components.
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, lastKey: undefined };

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): ErrorBoundaryState | null {
    if (props.resetKey !== state.lastKey) {
      return { hasError: false, lastKey: props.resetKey };
    }
    return null;
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Uncaught render error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column text-center align-items-center p-4">
          <h1 className="h4 mb-3">Something went wrong</h1>
          <p className="text-muted mb-4">
            The page crashed unexpectedly. Reload to continue.
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
