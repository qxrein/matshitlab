import React, { useState, useRef } from "react";
import { Workspace } from "../lib/Workspace";
import { Signal } from "../lib/Signal";
import { Play, Plus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Cell {
  id: string;
  code: string;
  output: string[];
  error?: string;
  plots: {
    signal: Signal;
    title: string;
    data: Array<{ x: number; y: number }>;
  }[];
}

const SignalPlot = ({
  data,
  title,
}: {
  data: Array<{ x: number; y: number }>;
  title: string;
}) => {
  return (
    <div className="w-full h-64 mt-4">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 20, left: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            label={{ value: "Time (s)", position: "bottom" }}
          />
          <YAxis
            label={{ value: "Amplitude", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            formatter={(value: number) => value.toFixed(3)}
            labelFormatter={(label: number) => `Time: ${label.toFixed(3)}s`}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#2563eb"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const NotebookCell = ({
  cell,
  onChange,
  onExecute,
}: {
  cell: Cell;
  onChange: (id: string, code: string) => void;
  onExecute: (id: string) => void;
}) => {
  return (
    <div className="border border-slate-200 rounded-lg mb-4 shadow-sm">
      <div className="flex items-center p-2 bg-slate-50 border-b border-slate-200 rounded-t-lg">
        <div className="text-xs text-slate-600 font-mono">In [{cell.id}]:</div>
        <button
          onClick={() => onExecute(cell.id)}
          className="ml-2 p-1 hover:bg-slate-200 rounded-md transition-colors"
        >
          <Play size={16} />
        </button>
      </div>

      <textarea
        value={cell.code}
        onChange={(e) => onChange(cell.id, e.target.value)}
        className="w-full h-40 font-mono p-4 text-sm bg-white resize-y"
        spellCheck={false}
        placeholder="// Enter your code here..."
      />

      {cell.output.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <div className="text-xs text-slate-600 font-mono mb-1">
            Out [{cell.id}]:
          </div>
          {cell.output.map((out, idx) => (
            <pre
              key={idx}
              className="font-mono text-sm whitespace-pre-wrap p-2 bg-white rounded-md"
            >
              {out}
            </pre>
          ))}
        </div>
      )}

      {cell.error && (
        <div className="border-t border-red-200 bg-red-50 p-3">
          <pre className="text-red-600 font-mono text-sm whitespace-pre-wrap">
            Error: {cell.error}
          </pre>
        </div>
      )}

      {cell.plots.length > 0 && (
        <div className="border-t border-slate-200 p-4">
          {cell.plots.map((plot, index) => (
            <SignalPlot key={index} data={plot.data} title={plot.title} />
          ))}
        </div>
      )}
    </div>
  );
};

const MatlabNotebook = () => {
  const workspace = useRef(new Workspace()).current;
  const [cells, setCells] = useState<Cell[]>([
    {
      id: "1",
      code: `// Example: Create a sine wave
s1 = sine(440, 0.1)  // 440 Hz for 0.1 seconds

// Example: Create a chirp signal
s2 = chirp({startFreq: 0,endFreq: 1000,duration: 0.5,method: 'linear'})`,
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
        if (cell.id !== id) return cell;

        try {
          const codeLines = cell.code
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("//"));

          const outputs: string[] = [];
          const plots: Cell["plots"] = [];

          for (const line of codeLines) {
            const output = workspace.execute(line);
            if (output) outputs.push(output);

            // Check for signal assignments
            if (line.includes("=")) {
              const varName = line.split("=")[0].trim();
              const value = workspace.getValue(varName);

              if (value instanceof Signal) {
                const timeArray = value.getTimeArray();
                const signalData = value.getData();

                plots.push({
                  signal: value,
                  title: `${varName} - Time Domain`,
                  data: timeArray.map((t, i) => ({
                    x: t,
                    y: signalData[i],
                  })),
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
      }),
    );
  };

  const addCell = () => {
    const newId = (parseInt(cells[cells.length - 1].id) + 1).toString();
    setCells([...cells, { id: newId, code: "", output: [], plots: [] }]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-4 mb-6">
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
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium"
      >
        <Plus size={16} />
        Add Cell
      </button>
    </div>
  );
};

export default MatlabNotebook;
