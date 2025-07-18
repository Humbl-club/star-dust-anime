import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { Component, ReactNode } from 'react';

// Import screen separately
const { screen } = await import('@testing-library/react');

// Mock Error Boundary Component
class TestErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div role="alert">
          <h2>Something went wrong</h2>
          <p>An error occurred while rendering this component.</p>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component that throws an error
const ThrowError = ({ shouldThrow = false, message = 'Test error' }: { shouldThrow?: boolean; message?: string }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Component rendered successfully</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error during tests to avoid cluttering output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <TestErrorBoundary>
        <ThrowError shouldThrow={false} />
      </TestErrorBoundary>
    );

    expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
  });

  it('should catch and display error when component throws', () => {
    render(
      <TestErrorBoundary>
        <ThrowError shouldThrow={true} message="Test error message" />
      </TestErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An error occurred while rendering this component.')).toBeInTheDocument();
  });

  it('should display error details when expanded', () => {
    render(
      <TestErrorBoundary>
        <ThrowError shouldThrow={true} message="Detailed error message" />
      </TestErrorBoundary>
    );

    const details = screen.getByText('Error details');
    expect(details).toBeInTheDocument();
    
    // Check if error message is present in details
    expect(screen.getByText('Detailed error message')).toBeInTheDocument();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <TestErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </TestErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should call componentDidCatch when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error');

    render(
      <TestErrorBoundary>
        <ThrowError shouldThrow={true} message="Component error" />
      </TestErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error Boundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should handle different types of errors', () => {
    const scenarios = [
      { message: 'Network error', expectedText: 'Network error' },
      { message: 'Validation failed', expectedText: 'Validation failed' },
      { message: 'Unauthorized access', expectedText: 'Unauthorized access' },
    ];

    scenarios.forEach(({ message, expectedText }) => {
      const { unmount } = render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={true} message={message} />
        </TestErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(expectedText)).toBeInTheDocument();
      
      unmount();
    });
  });

  it('should reset error state when children change', () => {
    const { rerender } = render(
      <TestErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TestErrorBoundary>
    );

    // Error boundary should show error
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Rerender with non-throwing component
    rerender(
      <TestErrorBoundary>
        <ThrowError shouldThrow={false} />
      </TestErrorBoundary>
    );

    // Note: In a real implementation, you'd need a way to reset the error boundary
    // This test shows the expected behavior, but the basic error boundary doesn't auto-reset
    expect(screen.getByRole('alert')).toBeInTheDocument(); // Still shows error
  });

  describe('Error Boundary Integration', () => {
    it('should prevent error propagation to parent components', () => {
      const parentErrorHandler = vi.fn();

      try {
        render(
          <div>
            <TestErrorBoundary>
              <ThrowError shouldThrow={true} />
            </TestErrorBoundary>
          </div>
        );
      } catch (error) {
        parentErrorHandler(error);
      }

      // Parent should not catch the error
      expect(parentErrorHandler).not.toHaveBeenCalled();
      
      // Error boundary should handle it
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle async errors appropriately', async () => {
      // Note: Error boundaries don't catch async errors by default
      // This test documents the expected behavior
      
      const AsyncErrorComponent = () => {
        setTimeout(() => {
          throw new Error('Async error');
        }, 0);
        return <div>Async component</div>;
      };

      render(
        <TestErrorBoundary>
          <AsyncErrorComponent />
        </TestErrorBoundary>
      );

      // Component should render normally (error boundary doesn't catch async errors)
      expect(screen.getByText('Async component')).toBeInTheDocument();
    });
  });
});