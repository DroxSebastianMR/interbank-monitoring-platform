export class ErrorReporter {
  static report(error: Error, info?: unknown) {
    if (__DEV__) {
      console.error("[ErrorBoundary]", error);
      console.error("[ErrorBoundary info]", info);
    }
  }
}
