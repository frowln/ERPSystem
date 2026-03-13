/// <reference types="vite/client" />

declare module '@tanstack/react-virtual' {
  export interface VirtualItem {
    index: number;
    start: number;
    size: number;
    end: number;
    key: string | number;
  }

  export interface VirtualizerOptions<TScrollElement extends Element, TItemElement extends Element> {
    count: number;
    getScrollElement: () => TScrollElement | null;
    estimateSize: (index: number) => number;
    overscan?: number;
  }

  export interface Virtualizer<TScrollElement extends Element, TItemElement extends Element> {
    getVirtualItems: () => VirtualItem[];
    getTotalSize: () => number;
    measureElement: (el: TItemElement | null) => void;
  }

  export function useVirtualizer<
    TScrollElement extends Element = Element,
    TItemElement extends Element = Element,
  >(
    options: VirtualizerOptions<TScrollElement, TItemElement>,
  ): Virtualizer<TScrollElement, TItemElement>;
}
