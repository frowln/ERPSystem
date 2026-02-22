declare module 'three' {
  export class Color {
    constructor(color?: number | string);
  }

  export class MeshLambertMaterial {
    constructor(parameters?: Record<string, unknown>);
  }
}
