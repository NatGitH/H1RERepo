import { Component } from "react";

/**
 * App-wide safety net. Catches any render/runtime error in the React tree and
 * shows a branded fallback with a button back to Home/Login, instead of a blank
 * white screen. Pairs with the "*" catch-all route (unknown URLs) and the
 * _redirects SPA fallback (hard refreshes).
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  handleGoHome = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          fontFamily: "Arial, sans-serif",
          color: "#0d1b3e",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#f97316", margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: 420, margin: 0 }}>
          An unexpected error occurred. You can head back to the login screen and
          try again.
        </p>
        <button
          onClick={this.handleGoHome}
          style={{
            background: "#0d1b3e",
            color: "#fff",
            border: "none",
            borderRadius: "9999px",
            padding: "12px 28px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
