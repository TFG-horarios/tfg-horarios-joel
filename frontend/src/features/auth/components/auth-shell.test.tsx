import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthShell } from './auth-shell';

describe('AuthShell', () => {
  const defaultProps = {
    title: 'Welcome Back',
    description: 'Please enter your details to sign in.',
  };

  it('renders the title and description correctly', () => {
    render(
      <AuthShell {...defaultProps}>
        <div data-testid="child-content">Test Children</div>
      </AuthShell>
    );

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <AuthShell {...defaultProps}>
        <button>Login Button</button>
      </AuthShell>
    );

    expect(
      screen.getByRole('button', { name: /login button/i })
    ).toBeInTheDocument();
  });

  it('renders the eyebrow text when provided', () => {
    render(
      <AuthShell {...defaultProps} eyebrow="Security">
        Content
      </AuthShell>
    );

    const eyebrowElement = screen.getByText('Security');
    expect(eyebrowElement).toBeInTheDocument();
  });

  it('does not render the eyebrow element when the prop is missing', () => {
    render(<AuthShell {...defaultProps}>Content</AuthShell>);
    const eyebrowElement = screen.queryByText(/Security/i);
    expect(eyebrowElement).not.toBeInTheDocument();
  });

  it('keeps heading semantics for the title', () => {
    render(<AuthShell {...defaultProps}>Content</AuthShell>);

    expect(
      screen.getByRole('heading', { name: defaultProps.title })
    ).toBeInTheDocument();
  });
});
