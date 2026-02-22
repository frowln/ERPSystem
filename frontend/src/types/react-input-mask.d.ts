declare module 'react-input-mask' {
  import type * as React from 'react';

  export interface InputState {
    value: string;
    selection: {
      start: number;
      end: number;
    } | null;
  }

  export interface BeforeMaskedStateChangeStates {
    previousState: InputState;
    currentState: InputState;
    nextState: InputState;
  }

  export interface InputMaskProps extends React.InputHTMLAttributes<HTMLInputElement> {
    mask: string | Array<string | RegExp>;
    maskChar?: string | null;
    alwaysShowMask?: boolean;
    formatChars?: Record<string, string>;
    inputRef?: React.Ref<HTMLInputElement>;
    beforeMaskedStateChange?: (states: BeforeMaskedStateChangeStates) => InputState;
    children?: (inputProps: React.InputHTMLAttributes<HTMLInputElement>) => React.ReactNode;
  }

  const InputMask: React.ComponentType<InputMaskProps>;
  export default InputMask;
}
