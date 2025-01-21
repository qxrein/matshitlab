import { Matrix2D, SimulationError, SimulationResult } from "./types";

export class Matrix {
  private data: Matrix2D;

  constructor(data: Matrix2D = [[]]) {
    this.validateData(data);
    this.data = data;
  }

  private validateData(data: Matrix2D): void {
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      throw new SimulationError(
        "Invalid matrix data: expected 2D array",
        "validation",
      );
    }
    const width = data[0].length;
    if (!data.every((row) => Array.isArray(row) && row.length === width)) {
      throw new SimulationError(
        "Invalid matrix data: rows must have equal length",
        "validation",
      );
    }
  }

  multiply(other: Matrix): SimulationResult<Matrix> {
    const startTime = performance.now();
    try {
      if (this.data[0].length !== other.data.length) {
        throw new SimulationError(
          "Invalid matrix dimensions for multiplication",
          "validation",
        );
      }

      const result = new Array(this.data.length)
        .fill(0)
        .map(() => new Array(other.data[0].length).fill(0));

      // Using typed arrays for better performance
      const m = this.data.length;
      const n = other.data[0].length;
      const p = other.data.length;

      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          let sum = 0;
          for (let k = 0; k < p; k++) {
            sum += this.data[i][k] * other.data[k][j];
          }
          result[i][j] = sum;
        }
      }

      return {
        data: new Matrix(result),
        metadata: {
          computationTime: performance.now() - startTime,
          memoryUsed: result.length * result[0].length * 8,
          precision: 64,
          success: true,
        },
      };
    } catch (error) {
      throw new SimulationError(
        "Matrix multiplication failed",
        "computation",
        error,
      );
    }
  }

  getData(): Matrix2D {
    return this.data;
  }

  toString(): string {
    return (
      `Matrix[${this.data.length}x${this.data[0].length}]\n` +
      this.data.map((row) => row.join("\t")).join("\n")
    );
  }
}
