import React, { useState, useRef } from "react";
import { Matrix } from "../lib/Matrix";
import { Signal } from "../lib/Signal";
import { Workspace } from "../lib/Workspace";
import Plot from "./Plot";
import { Play } from "lucide-react";

interface Cell {
  id: string;
  code: string;
  output: string[];
  error?: string;
  plots: {
    signal: Signal;
    title: string;
  }[];
}

const NotebookCell: React.FC<{
  cell: Cell;
  onChange: (id: string, code: string) => void;
  onExecute: (id: string) => void;
}> = ({ cell, onChange, onExecute }) => {
  return (
    <div className="border border-gray-300 rounded-md mb-4 bg-gray-50">
      <div className="flex items-center p-2 bg-gray-100 border-b border-gray-300">
        <div className="text-xs text-gray-600 font-mono">In [{cell.id}]:</div>
        <button
          onClick={() => onExecute(cell.id)}
          className="ml-2 p-1 hover:bg-gray-200 rounded"
        >
          <Play size={16} />
        </button>
      </div>
      <textarea
        value={cell.code}
        onChange={(e) => onChange(cell.id, e.target.value)}
        className="w-full h-32 font-mono p-3 text-sm"
        spellCheck="false"
      />
      {cell.output.length > 0 && (
        <div className="border-t border-gray-300 bg-gray-100 p-2">
          <div className="text-xs text-gray-600 font-mono">
            Out [{cell.id}]:
          </div>
          {cell.output.map((out, idx) => (
            <pre key={idx} className="font-mono text-sm overflow-x-auto p-2">
              {out}
            </pre>
          ))}
        </div>
      )}
      {cell.error && (
        <div className="border-t border-red-200 bg-red-50 p-2">
          <pre className="text-red-600 font-mono text-sm">{cell.error}</pre>
        </div>
      )}
      {cell.plots.length > 0 && (
        <div className="border-t border-gray-300 p-4 space-y-4">
          {cell.plots.map((plot, index) => (
            <Plot
              key={index}
              signal={plot.signal}
              title={plot.title}
              width={600}
              height={300}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Notebook: React.FC = () => {
  const workspace = useRef(new Workspace()).current;
  const [cells, setCells] = useState<Cell[]>([
    {
      id: "1",
      code: `// Create a sine wave signal
s1 = sine(2, 1)

// Create a matrix
m1 = matrix([[1, 2], [3, 4]])`,
      output: [],
      plots: [],
    },
  ]);

  const handleCodeChange = (id: string, newCode: string) => {
    setCells(
      cells.map((cell) => (cell.id === id ? { ...cell, code: newCode } : cell)),
    );
  };

  const executeCell = (id: string) => {
    setCells(
      cells.map((cell) => {
        if (cell.id === id) {
          try {
            // Split code into lines and remove comments
            const codeLines = cell.code
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line && !line.startsWith("//"));

            const outputs: string[] = [];
            const plots: { signal: Signal; title: string }[] = [];

            // Execute each line separately
            for (const line of codeLines) {
              const output = workspace.execute(line);
              if (output) outputs.push(output);

              // Check for signals to plot
              if (line.includes("=")) {
                const varName = line.split("=")[0].trim();
                const value = workspace.getValue(varName);
                if (value instanceof Signal) {
                  plots.push({
                    signal: value,
                    title: `${varName} - Time Domain`,
                  });
                }
              }
            }

            return {
              ...cell,
              output: outputs,
              plots,
              error: undefined,
            };
          } catch (err) {
            return {
              ...cell,
              output: [],
              plots: [],
              error: err instanceof Error ? err.message : String(err),
            };
          }
        }
        return cell;
      }),
    );
  };

  const addCell = () => {
    const newId = (parseInt(cells[cells.length - 1].id) + 1).toString();
    setCells([...cells, { id: newId, code: "", output: [], plots: [] }]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-2">
        {cells.map((cell) => (
          <NotebookCell
            key={cell.id}
            cell={cell}
            onChange={handleCodeChange}
            onExecute={executeCell}
          />
        ))}
      </div>
      <button
        onClick={addCell}
        className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-mono text-sm"
      >
        + Add Cell
      </button>
    </div>
  );
};

export default Notebook;
