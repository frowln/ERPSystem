// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FormField, Input, Textarea, Select, Checkbox } from './index';

afterEach(cleanup);

describe('FormField', () => {
  it('renders label when provided', () => {
    render(
      <FormField label="Email">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <FormField label="Name">
        <input data-testid="child-input" />
      </FormField>,
    );
    expect(screen.getByTestId('child-input')).toBeInTheDocument();
  });

  it('shows required asterisk when required=true', () => {
    render(
      <FormField label="Email" required>
        <input />
      </FormField>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error message with alert role', () => {
    render(
      <FormField label="Email" error="Invalid email">
        <input />
      </FormField>,
    );
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Invalid email');
  });

  it('shows hint when no error', () => {
    render(
      <FormField label="Email" hint="Enter your email">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('hides hint when error is present', () => {
    render(
      <FormField label="Email" hint="Enter your email" error="Required">
        <input />
      </FormField>,
    );
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(
      <FormField>
        <input data-testid="no-label-input" />
      </FormField>,
    );
    expect(screen.getByTestId('no-label-input')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FormField className="my-class">
        <input />
      </FormField>,
    );
    expect(container.firstElementChild?.className).toContain('my-class');
  });
});

describe('Input', () => {
  it('renders with default type=text', () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');
  });

  it('accepts custom type', () => {
    render(<Input type="email" data-testid="email-input" />);
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
  });

  it('applies error styles when hasError=true', () => {
    render(<Input hasError data-testid="error-input" />);
    expect(screen.getByTestId('error-input').className).toContain('border-danger-300');
  });

  it('does not apply error styles by default', () => {
    render(<Input data-testid="normal-input" />);
    expect(screen.getByTestId('normal-input').className).not.toContain('border-danger-300');
  });

  it('handles onChange', () => {
    const onChange = vi.fn();
    render(<Input data-testid="input" onChange={onChange} />);
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('has displayName set', () => {
    expect(Input.displayName).toBe('Input');
  });
});

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea data-testid="textarea" />);
    expect(screen.getByTestId('textarea').tagName).toBe('TEXTAREA');
  });

  it('applies error styles when hasError=true', () => {
    render(<Textarea hasError data-testid="textarea" />);
    expect(screen.getByTestId('textarea').className).toContain('border-danger-300');
  });

  it('handles text input', () => {
    const onChange = vi.fn();
    render(<Textarea data-testid="textarea" onChange={onChange} />);
    fireEvent.change(screen.getByTestId('textarea'), { target: { value: 'text' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('has displayName set', () => {
    expect(Textarea.displayName).toBe('Textarea');
  });
});

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' },
  ];

  it('renders all options', () => {
    render(<Select options={options} data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select.querySelectorAll('option')).toHaveLength(3);
  });

  it('renders placeholder when provided', () => {
    render(<Select options={options} placeholder="Choose..." data-testid="select" />);
    const placeholderOpt = screen.getByText('Choose...');
    expect(placeholderOpt).toBeInTheDocument();
    expect(placeholderOpt).toHaveAttribute('disabled');
  });

  it('applies error styles when hasError=true', () => {
    render(<Select options={options} hasError data-testid="select" />);
    expect(screen.getByTestId('select').className).toContain('border-danger-300');
  });

  it('handles change events', () => {
    const onChange = vi.fn();
    render(<Select options={options} data-testid="select" onChange={onChange} />);
    fireEvent.change(screen.getByTestId('select'), { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('has displayName set', () => {
    expect(Select.displayName).toBe('Select');
  });
});

describe('Checkbox', () => {
  it('renders a checkbox input', () => {
    render(<Checkbox data-testid="cb" />);
    expect(screen.getByTestId('cb')).toHaveAttribute('type', 'checkbox');
  });

  it('renders label when provided', () => {
    render(<Checkbox id="test-cb" label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('handles change events', () => {
    const onChange = vi.fn();
    render(<Checkbox data-testid="cb" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('cb'));
    expect(onChange).toHaveBeenCalled();
  });

  it('has displayName set', () => {
    expect(Checkbox.displayName).toBe('Checkbox');
  });
});
