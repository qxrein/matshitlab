import { Matrix } from "./Matrix";
import { Signal } from "./Signal";
import { SimulationError } from "./types/index.ts";

type WorkspaceValue = Signal | Matrix | number | Function;

export class Workspace {
  private variables: Map<string, WorkspaceValue>;
  private history: string[];

  constructor() {
    this.variables = new Map<string, WorkspaceValue>();
    this.history = [];
    this.registerBuiltins();
  }

  private registerBuiltins(): void {
    // Register signal generation functions
    this.variables.set(
      "sine",
      (freq: number, duration: number, sampleRate: number = 44100) => {
        const result = Signal.generateSine(freq, duration, sampleRate);
        return result.data;
      },
    );

    this.variables.set(
      "square",
      (freq: number, duration: number, sampleRate: number = 44100) => {
        const result = Signal.generateSquare(freq, duration, sampleRate);
        return result.data;
      },
    );

    this.variables.set(
      "chirp",
      (options: {
        startFreq: number;
        endFreq: number;
        duration: number;
        method?: "linear" | "exponential";
        sampleRate?: number;
      }) => {
        const result = Signal.generateChirp(options);
        return result.data;
      },
    );

    this.variables.set("matrix", (data: number[][]) => new Matrix(data));
  }

  execute(code: string): string {
    try {
      const lines = code
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("//"));

      let result = "";

      for (const line of lines) {
        const lineResult = this.executeLine(this.removeInlineComments(line));
        if (lineResult) {
          result += lineResult + "\n";
          this.history.push(line);
        }
      }

      return result.trim();
    } catch (err) {
      throw new SimulationError(
        `Execution error: ${err instanceof Error ? err.message : String(err)}`,
        "runtime",
        err,
      );
    }
  }

  private removeInlineComments(line: string): string {
    const commentIndex = line.indexOf("//");
    return commentIndex !== -1
      ? line.substring(0, commentIndex).trim()
      : line.trim();
  }

  private executeLine(line: string): string {
    if (!line) return "";

    try {
      if (line.includes("=")) {
        const [varName, expression] = line.split("=").map((s) => s.trim());
        if (!varName || !expression) {
          throw new SimulationError("Invalid assignment", "validation");
        }
        const value = this.evaluateExpression(expression);
        this.variables.set(varName, value);
        return `${varName} = ${this.formatOutput(value)}`;
      } else {
        const value = this.evaluateExpression(line);
        return this.formatOutput(value);
      }
    } catch (err) {
      throw new SimulationError(
        `Line "${line}": ${err instanceof Error ? err.message : String(err)}`,
        "runtime",
        err,
      );
    }
  }

  private evaluateExpression(expr: string): WorkspaceValue {
    if (!expr) throw new SimulationError("Empty expression", "validation");

    // Handle function calls with arguments
    if (expr.includes("(")) {
      return this.evaluateFunctionCall(expr);
    }

    // Handle numbers
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }

    // Handle variable references
    const value = this.variables.get(expr);
    if (value !== undefined) {
      return value;
    }

    throw new SimulationError(
      `Cannot evaluate expression: '${expr}'`,
      "validation",
    );
  }

  private evaluateFunctionCall(expr: string): WorkspaceValue {
    const funcName = expr.substring(0, expr.indexOf("(")).trim();
    const argsStr = expr
      .substring(expr.indexOf("(") + 1, this.findMatchingParenthesis(expr))
      .trim();

    const func = this.variables.get(funcName);
    if (typeof func !== "function") {
      throw new SimulationError(
        `Function '${funcName}' is not defined`,
        "validation",
      );
    }

    // Parse arguments
    const args = this.parseArguments(argsStr, funcName);
    return func(...args);
  }

  private findMatchingParenthesis(expr: string): number {
    let count = 0;
    let startFound = false;

    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === "(") {
        startFound = true;
        count++;
      } else if (expr[i] === ")") {
        count--;
        if (startFound && count === 0) {
          return i;
        }
      }
    }

    throw new SimulationError("Unmatched parentheses", "validation");
  }

  private parseArguments(argsStr: string, funcName: string): any[] {
    if (!argsStr) return [];

    if (funcName === "matrix") {
      try {
        return [JSON.parse(argsStr.replace(/\s+/g, ""))];
      } catch (err) {
        throw new SimulationError("Invalid matrix format", "validation");
      }
    }

    // Handle object literal for chirp function
    if (funcName === "chirp" && argsStr.startsWith("{")) {
      try {
        // Convert to valid JSON format
        const jsonStr = argsStr
          .replace(/(\w+):/g, '"$1":') // Add quotes to keys
          .replace(/'/g, '"'); // Replace single quotes with double quotes
        const options = JSON.parse(jsonStr);
        return [options];
      } catch (err) {
        throw new SimulationError(
          "Invalid options object format",
          "validation",
        );
      }
    }

    // Handle regular comma-separated arguments
    return argsStr.split(",").map((arg) => {
      const trimmed = arg.trim();
      // Try to parse as number first
      const num = Number(trimmed);
      if (!isNaN(num)) return num;
      // Otherwise evaluate as expression
      return this.evaluateExpression(trimmed);
    });
  }

  private formatOutput(value: WorkspaceValue): string {
    if (value instanceof Signal) {
      const data = value.getData();
      return `Signal[${data.length} samples] = [${data.slice(0, 5).join(", ")}...]`;
    }
    if (value instanceof Matrix) {
      return value.toString();
    }
    if (typeof value === "function") {
      return "[Function]";
    }
    return String(value);
  }

  getValue(name: string): WorkspaceValue | undefined {
    return this.variables.get(name);
  }

  getHistory(): string[] {
    return [...this.history];
  }
}
