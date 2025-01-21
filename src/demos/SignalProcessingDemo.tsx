import React, { useState } from "react";
import { Signal } from "../lib/Signal";
import Plot from "../components/Plot";

interface DemoState {
  frequency: number;
  amplitude: number;
  duration: number;
  signalType: "sine" | "square";
}

const SignalProcessingDemo: React.FC = () => {
  const [params, setParams] = useState<DemoState>({
    frequency: 2,
    amplitude: 1,
    duration: 1,
    signalType: "sine",
  });

  const generateSignal = (): Signal => {
    const { frequency, amplitude, duration, signalType } = params;
    let signal: Signal;

    if (signalType === "sine") {
      signal = Signal.generateSine(frequency, duration);
    } else {
      signal = Signal.generateSquare(frequency, duration);
    }

    return signal.multiply(amplitude);
  };

  const signal = generateSignal();

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-mono">
            Frequency (Hz):
            <input
              type="number"
              value={params.frequency}
              onChange={(e) =>
                setParams({ ...params, frequency: Number(e.target.value) })
              }
              className="w-full p-1 border rounded"
            />
          </label>
          <label className="block text-sm font-mono">
            Amplitude:
            <input
              type="number"
              value={params.amplitude}
              onChange={(e) =>
                setParams({ ...params, amplitude: Number(e.target.value) })
              }
              className="w-full p-1 border rounded"
            />
          </label>
          <label className="block text-sm font-mono">
            Duration (s):
            <input
              type="number"
              value={params.duration}
              onChange={(e) =>
                setParams({ ...params, duration: Number(e.target.value) })
              }
              className="w-full p-1 border rounded"
            />
          </label>
          <label className="block text-sm font-mono">
            Signal Type:
            <select
              value={params.signalType}
              onChange={(e) =>
                setParams({
                  ...params,
                  signalType: e.target.value as "sine" | "square",
                })
              }
              className="w-full p-1 border rounded"
            >
              <option value="sine">Sine Wave</option>
              <option value="square">Square Wave</option>
            </select>
          </label>
        </div>
        <div>
          <Plot signal={signal} title="Signal Visualization" />
        </div>
      </div>
    </div>
  );
};

export default SignalProcessingDemo;
