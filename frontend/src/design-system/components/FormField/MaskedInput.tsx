import React, { forwardRef } from 'react';
import InputMask from 'react-input-mask';
import { Input } from './index';

interface MaskedInputProps {
  mask: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  hasError?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, ...props }, ref) => {
    return (
      <InputMask mask={mask} {...props}>
        {(inputProps: React.InputHTMLAttributes<HTMLInputElement>) => (
          <Input ref={ref} {...inputProps} hasError={props.hasError} />
        )}
      </InputMask>
    );
  },
);

MaskedInput.displayName = 'MaskedInput';
