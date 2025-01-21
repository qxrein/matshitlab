import React, { useState } from "react";
import { Matrix } from "../lib/Matrix";

export const MatrixDemo: React.FC = () => {
  const [code, setCode] = useState(`// Matrix operations example
const A = Matrix.fromArray([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]);

// Create matrix B
const B = Matrix.fromArray([
  [9, 8, 7],
  [6, 5, 4],
  [3, 2, 1]
]);

// Print matrices
console.log("Matrix A:");
console.log(A.toArray());
console.log("\\nMatrix B:");
console.log(B.toArray());`);

  const [output, setOutput] = useState("");

  const executeCode = () => {
    // Clear previous output before executing new code
    setOutput("");

    try {
      const workspace = {
        Matrix,
        console: {
          log: (...args: any[]) => {
            setOutput(
              (prev) =>
                prev +
                args
                  .map((arg) =>
                    typeof arg === "object"
                      ? JSON.stringify(arg, null, 2)
                      : String(arg),
                  )
                  .join(" ") +
                "\n",
            );
          },
        },
      };

      new Function(...Object.keys(workspace), code)(
        ...Object.values(workspace),
      );
    } catch (error) {
      setOutput(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <div className="font-mono">
      <h2 className="text-xl mb-4">Matrix Operations</h2>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <textarea
            className="w-full h-64 p-4 bg-gray-900 text-gray-100 font-mono text-sm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={executeCode}
            className="bg-blue-500 text-white px-4 py-2"
          >
            Run
          </button>
          <button
            onClick={() => setOutput("")}
            className="bg-gray-200 px-4 py-2"
          >
            Clear Output
          </button>
        </div>

        <pre className="bg-gray-100 p-4 whitespace-pre-wrap font-mono text-sm">
          {output || "Output will appear here..."}
        </pre>
      </div>
    </div>
  );
};
