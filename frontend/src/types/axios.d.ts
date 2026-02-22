import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    suppressGlobalErrorToast?: boolean;
    suppressGlobalErrorStatuses?: number[];
    showGlobalErrorToastForRead?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    suppressGlobalErrorToast?: boolean;
    suppressGlobalErrorStatuses?: number[];
    showGlobalErrorToastForRead?: boolean;
  }
}
