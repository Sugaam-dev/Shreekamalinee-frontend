import { Component } from "react";
import { Link } from "react-router-dom";

/**
 * Error Boundary for lazy-loaded route chunks.
 * Catches chunk load failures and React rendering errors,
 * preventing a full white-screen crash.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    const isChunkError =
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Importing a module script failed");
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error, info) {
    // Only log in development
    if (import.meta.env.DEV) {
      console.error("[RouteErrorBoundary]", error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, isChunkError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-2">
            {this.state.isChunkError ? "Page Failed to Load" : "Something Went Wrong"}
          </h2>
          <p className="text-sm text-charcoal/60 mb-6 max-w-sm">
            {this.state.isChunkError
              ? "A new version of Shreekamalinee may be available. Please reload the page."
              : "An unexpected error occurred. Please try again or return to your portal."}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={this.handleRetry}
              className="px-6 py-2.5 bg-rust text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-rust-deep transition-colors cursor-pointer"
            >
              {this.state.isChunkError ? "Reload Page" : "Try Again"}
            </button>
            {typeof window !== "undefined" && window.location.pathname.startsWith("/admin") ? (
              <Link
                to="/admin/dashboard"
                onClick={() => this.setState({ hasError: false, isChunkError: false })}
                className="px-6 py-2.5 border border-line text-charcoal text-xs font-bold uppercase tracking-wider rounded-full hover:border-charcoal/40 transition-colors"
              >
                Return to Dashboard
              </Link>
            ) : (
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, isChunkError: false })}
                className="px-6 py-2.5 border border-line text-charcoal text-xs font-bold uppercase tracking-wider rounded-full hover:border-charcoal/40 transition-colors"
              >
                Return Home
              </Link>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
