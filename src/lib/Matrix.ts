// src/lib/Matrix.ts
export class Matrix {
  private data: number[][];

  constructor(data: number[][]) {
    this.validateData(data);
    this.data = data.map((row) => [...row]);
  }

  private validateData(data: number[][]) {
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      throw new Error("Invalid matrix data");
    }

    const rowLength = data[0].length;
    if (!data.every((row) => row.length === rowLength)) {
      throw new Error("All rows must have the same length");
    }
  }

  getRows(): number {
    return this.data.length;
  }

  getCols(): number {
    return this.data[0].length;
  }

  get(i: number, j: number): number {
    if (i < 0 || i >= this.getRows() || j < 0 || j >= this.getCols()) {
      throw new Error("Index out of bounds");
    }
    return this.data[i][j];
  }

  set(i: number, j: number, value: number): void {
    if (i < 0 || i >= this.getRows() || j < 0 || j >= this.getCols()) {
      throw new Error("Index out of bounds");
    }
    this.data[i][j] = value;
  }

  add(other: Matrix): Matrix {
    if (
      this.getRows() !== other.getRows() ||
      this.getCols() !== other.getCols()
    ) {
      throw new Error("Matrix dimensions must match");
    }

    const result = this.data.map((row, i) =>
      row.map((val, j) => val + other.get(i, j)),
    );
    return new Matrix(result);
  }

  multiply(other: Matrix | number): Matrix {
    if (typeof other === "number") {
      const result = this.data.map((row) => row.map((val) => val * other));
      return new Matrix(result);
    }

    if (this.getCols() !== other.getRows()) {
      throw new Error("Invalid matrix dimensions for multiplication");
    }

    const result: number[][] = [];
    for (let i = 0; i < this.getRows(); i++) {
      result[i] = [];
      for (let j = 0; j < other.getCols(); j++) {
        let sum = 0;
        for (let k = 0; k < this.getCols(); k++) {
          sum += this.get(i, k) * other.get(k, j);
        }
        result[i][j] = sum;
      }
    }
    return new Matrix(result);
  }

  transpose(): Matrix {
    const result = Array(this.getCols())
      .fill(0)
      .map(() => Array(this.getRows()).fill(0));

    for (let i = 0; i < this.getRows(); i++) {
      for (let j = 0; j < this.getCols(); j++) {
        result[j][i] = this.data[i][j];
      }
    }
    return new Matrix(result);
  }

  toString(): string {
    return (
      "[" + this.data.map((row) => "[" + row.join(", ") + "]").join("\n ") + "]"
    );
  }
}
