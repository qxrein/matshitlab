import { Matrix } from "./Matrix";
import { Signal } from "./Signal";

interface SignalData {
  t: number[];
  y: number[];
  type: string;
}

type WorkspaceValue = Signal | Matrix | number | Function;

export class Workspace {
  private variables: Map<string, WorkspaceValue>;

  constructor() {
    this.variables = new Map<string, WorkspaceValue>();

    // Add built-in functions
    this.variables.set(
      "sine",
      (freq: number, duration: number): Signal =>
        Signal.generateSine(freq, duration),
    );

    this.variables.set(
      "square",
      (freq: number, duration: number): Signal =>
        Signal.generateSquare(freq, duration),
    );

    this.variables.set("matrix", (data: string): Matrix => {
      try {
        // Remove any whitespace from the string to ensure clean evaluation
        const cleanData = data.replace(/\s+/g, "");
        // Safely evaluate array literal string
        const arrayData = new Function(`return ${cleanData}`)() as number[][];
        return new Matrix(arrayData);
      } catch (err) {
        throw new Error("Invalid matrix data format");
      }
    });
  }

  execute(code: string): string {
    try {
      // Split into lines and clean up
      const lines = code
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("//"));

      let result = "";

      // Execute each non-empty, non-comment line
      for (const line of lines) {
        const lineResult = this.executeLine(this.removeInlineComments(line));
        if (lineResult) {
          result += lineResult + "\n";
        }
      }

      return result.trim();
    } catch (err) {
      throw new Error(
        `Execution error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private removeInlineComments(line: string): string {
    // Remove inline comments
    const commentIndex = line.indexOf("//");
    if (commentIndex !== -1) {
      return line.substring(0, commentIndex).trim();
    }
    return line.trim();
  }

  private executeLine(line: string): string {
    if (!line) return "";

    try {
      if (line.includes("=")) {
        const [varName, expression] = line.split("=").map((s) => s.trim());
        if (!varName || !expression) {
          throw new Error("Invalid assignment");
        }
        const value = this.evaluateExpression(expression);
        this.variables.set(varName, value);
        return `${varName} = ${this.formatOutput(value)}`;
      } else {
        const value = this.evaluateExpression(line);
        return this.formatOutput(value);
      }
    } catch (err) {
      throw new Error(
        `Line "${line}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private evaluateExpression(expr: string): WorkspaceValue {
    if (!expr) throw new Error("Empty expression");

    // Handle method calls (e.g., s1.add(s2))
    if (expr.includes(".")) {
      const [objName, methodCall] = expr.split(".");
      const obj = this.variables.get(objName);
      if (!obj) {
        throw new Error(`Variable '${objName}' is not defined`);
      }

      const methodMatch = methodCall.match(/(\w+)\((.*)\)/);
      if (!methodMatch) {
        throw new Error(`Invalid method call: ${methodCall}`);
      }

      const [_, methodName, argsStr] = methodMatch;
      const args = argsStr
        ? argsStr.split(",").map((arg) => this.evaluateExpression(arg.trim()))
        : [];

      if (typeof (obj as any)[methodName] !== "function") {
        throw new Error(`Method '${methodName}' not found on ${objName}`);
      }

      return (obj as any)[methodName].apply(obj, args);
    }

    // Handle function calls
    if (expr.includes("(")) {
      const funcName = expr.split("(")[0].trim();
      const func = this.variables.get(funcName);
      if (typeof func !== "function") {
        throw new Error(`Function '${funcName}' is not defined`);
      }

      const argsStr = expr
        .slice(expr.indexOf("(") + 1, expr.lastIndexOf(")"))
        .trim();

      if (funcName === "matrix") {
        return func(argsStr);
      }

      const args = argsStr
        ? argsStr.split(",").map((arg) => this.evaluateExpression(arg.trim()))
        : [];

      return func(...args);
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

    throw new Error(`Cannot evaluate expression: '${expr}'`);
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

  setValue(name: string, value: WorkspaceValue): void {
    this.variables.set(name, value);
  }
}
