export type Vector = number[];
export type ComplexVector = Complex[];
export type Matrix2D = number[][];

export interface Complex {
  re: number;
  im: number;
}

export interface FilterSpec {
  type: "lowpass" | "highpass" | "bandpass" | "bandstop";
  cutoffFreq: number | [number, number];
  order?: number;
  ripple?: number;
}

export interface WindowFunction {
  type: "hamming" | "hanning" | "blackman" | "rectangular";
  length: number;
}

export interface SimulationResult<T> {
  data: T;
  metadata: {
    computationTime: number;
    memoryUsed: number;
    precision: number;
    success: boolean;
    error?: string;
  };
}

export class SimulationError extends Error {
  constructor(
    message: string,
    public readonly errorType:
      | "computation"
      | "memory"
      | "validation"
      | "runtime",
    public readonly details?: any,
  ) {
    super(message);
    this.name = "SimulationError";
  }
}
