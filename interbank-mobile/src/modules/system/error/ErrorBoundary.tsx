import { ErrorFallback } from "@/src/modules/system/error/ErrorFallback";
import { resolveErrorType } from "@/src/modules/system/error/ErrorPolicy";
import { ErrorReporter } from "@/src/modules/system/error/ErrorReporter";
import { ErrorBoundaryState } from "@/src/modules/system/error/types";
import React from "react";

type Props = {
  children: React.ReactNode;
  isolate?: boolean;
};

export class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: undefined,
    errorType: undefined,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const errorType = resolveErrorType(error);

    this.setState({ errorType });
    ErrorReporter.report(error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorType: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback type={this.state.errorType} onRetry={this.handleRetry} />
      );
    }

    return this.props.children;
  }
}
