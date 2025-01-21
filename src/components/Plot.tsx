import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Signal } from "../lib/Signal";

interface PlotProps {
  signal: Signal;
  title?: string;
  width?: number;
  height?: number;
}

const Plot: React.FC<PlotProps> = ({
  signal,
  title,
  width = 600,
  height = 300,
}) => {
  const data = signal.getTimeArray().map((t, i) => ({
    x: t,
    y: signal.getData()[i],
  }));

  return (
    <div className="plot-container">
      {title && <h3 className="text-sm font-mono mb-2">{title}</h3>}
      <div style={{ width, height }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 20, left: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              label={{
                value: "Time (s)",
                position: "bottom",
              }}
            />
            <YAxis
              label={{
                value: "Amplitude",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              formatter={(value: number) => value.toFixed(3)}
              labelFormatter={(label: number) => `Time: ${label.toFixed(3)}s`}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="#8884d8"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Plot;
