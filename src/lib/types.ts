export type Vector = number[];
export type ComplexVector = Complex[];
export type Complex = { real: number; imag: number };

export interface WindowFunction {
  type: "hamming" | "hanning";
}

export interface FilterSpec {
  type: string;
  params: Record<string, number>;
}

export interface SimulationResult<T> {
  data: T;
  metadata: {
    computationTime: number;
    memoryUsed: number;
    precision: number;
    success: boolean;
  };
}

export class SimulationError extends Error {
  constructor(
    message: string,
    public type: "validation" | "computation" | "runtime",
    public originalError?: unknown,
  ) {
    super(message);
  }
}
