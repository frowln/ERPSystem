declare module 'web-ifc-viewer' {
  export interface IfcViewerInitOptions {
    container: HTMLElement;
    backgroundColor?: unknown;
  }

  export class IfcViewerAPI {
    constructor(options: IfcViewerInitOptions);
    IFC: {
      setWasmPath(path: string): Promise<void>;
      loadIfcUrl(url: string, fitToFrame?: boolean, onProgress?: (progress: number) => void): Promise<{ modelID: number }>;
      selector: {
        highlightIfcItemsByID(modelId: number, ids: number[], material?: unknown): void;
        pickIfcItem(): Promise<{ id: number } | null>;
      };
      dispose?: () => void;
    };
    axes: { setAxes(): void };
    grid: { setGrid(): void };
    context?: { resetCameraFitToScene?: () => void };
  }
}
