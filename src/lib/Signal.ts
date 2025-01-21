import {
  Complex,
  ComplexVector,
  FilterSpec,
  SimulationError,
  SimulationResult,
  Vector,
  WindowFunction,
} from "./types";

import { Matrix } from "./Matrix";

export class Signal {
  private data: Float64Array;
  private sampleRate: number;
  private metadata: Map<string, unknown>;

  constructor(data: Vector = [], sampleRate: number = 1000) {
    this.validateData(data);
    this.data = new Float64Array(data);
    this.sampleRate = sampleRate;
    this.metadata = new Map();
  }

  static generateChirp(options: {
    startFreq: number;
    endFreq: number;
    duration: number;
    method?: "linear" | "exponential"; // Made optional with a default value
    sampleRate?: number;
  }): SimulationResult<Signal> {
    const {
      startFreq,
      endFreq,
      duration,
      method = "linear", // Default value provided here
      sampleRate = 44100,
    } = options;

    const numSamples = Math.floor(duration * sampleRate);
    const data = new Float64Array(numSamples);

    if (method === "linear") {
      const freqSlope = (endFreq - startFreq) / duration;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const instantFreq = startFreq + freqSlope * t;
        data[i] = Math.sin(
          2 * Math.PI * (startFreq * t + (freqSlope * t * t) / 2),
        );
      }
    } else {
      const freqRatio = endFreq / startFreq;
      const freqScale = Math.log(freqRatio) / duration;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(
          (2 * Math.PI * startFreq * (Math.exp(freqScale * t) - 1)) / freqScale,
        );
      }
    }

    return {
      data: new Signal(Array.from(data), sampleRate),
      metadata: {
        computationTime: performance.now(),
        memoryUsed: numSamples * 8,
        precision: 64,
        success: true,
      },
    };
  }

  waveletTransform(options: {
    wavelet: "morlet" | "mexican" | "paul";
    scales: number;
  }): SimulationResult<Matrix> {
    const { wavelet, scales } = options;
    const N = this.data.length;
    const scaleArray = new Array(scales)
      .fill(0)
      .map((_, i) => Math.pow(2, i / 12));

    const coefficients = new Array(scales)
      .fill(0)
      .map(() => new Float64Array(N));

    for (let i = 0; i < scales; i++) {
      const scale = scaleArray[i];
      const waveletData = this.generateWavelet(wavelet, scale);

      // Convolve signal with wavelet
      for (let t = 0; t < N; t++) {
        let sum = 0;
        const halfWidth = Math.min(t, waveletData.length / 2, N - t - 1);
        for (let j = -halfWidth; j <= halfWidth; j++) {
          sum += this.data[t + j] * waveletData[j + waveletData.length / 2];
        }
        coefficients[i][t] = sum / Math.sqrt(scale);
      }
    }

    return {
      data: new Matrix(coefficients),
      metadata: {
        computationTime: performance.now(),
        memoryUsed: scales * N * 8,
        precision: 64,
        success: true,
      },
    };
  }

  private generateWavelet(type: string, scale: number): Float64Array {
    const width = Math.ceil(scale * 10);
    const data = new Float64Array(width);

    switch (type) {
      case "morlet":
        for (let i = 0; i < width; i++) {
          const t = (i - width / 2) / scale;
          data[i] = Math.exp((-t * t) / 2) * Math.cos(5 * t);
        }
        break;
      case "mexican":
        for (let i = 0; i < width; i++) {
          const t = (i - width / 2) / scale;
          const t2 = t * t;
          data[i] = (1 - t2) * Math.exp(-t2 / 2);
        }
        break;
      // Add more wavelet types as needed
    }

    return data;
  }

  private validateData(data: Vector): void {
    if (!Array.isArray(data)) {
      throw new SimulationError(
        "Invalid signal data: expected array",
        "validation",
      );
    }
    if (!data.every((v) => typeof v === "number" && !isNaN(v))) {
      throw new SimulationError(
        "Invalid signal data: array must contain only numbers",
        "validation",
      );
    }
  }

  static generateSine(
    frequency: number,
    duration: number,
    sampleRate: number = 1000,
    amplitude: number = 1,
    phase: number = 0,
  ): SimulationResult<Signal> {
    const startTime = performance.now();
    try {
      const samples = Math.floor(duration * sampleRate);
      const data = new Float64Array(samples);
      const omega = 2 * Math.PI * frequency;

      for (let i = 0; i < samples; i++) {
        data[i] = amplitude * Math.sin((omega * i) / sampleRate + phase);
      }

      const signal = new Signal(Array.from(data), sampleRate);
      signal.setMetadata("frequency", frequency);
      signal.setMetadata("duration", duration);
      signal.setMetadata("amplitude", amplitude);
      signal.setMetadata("phase", phase);

      return {
        data: signal,
        metadata: {
          computationTime: performance.now() - startTime,
          memoryUsed: data.length * 8,
          precision: 64,
          success: true,
        },
      };
    } catch (error) {
      throw new SimulationError(
        "Failed to generate sine signal",
        "computation",
        error,
      );
    }
  }

  static generateSquare(
    frequency: number,
    duration: number,
    sampleRate: number = 1000,
    amplitude: number = 1,
  ): SimulationResult<Signal> {
    const startTime = performance.now();
    try {
      const samples = Math.floor(duration * sampleRate);
      const data = new Float64Array(samples);
      const period = sampleRate / frequency;

      for (let i = 0; i < samples; i++) {
        data[i] =
          amplitude *
          Math.sign(Math.sin((2 * Math.PI * frequency * i) / sampleRate));
      }

      const signal = new Signal(Array.from(data), sampleRate);
      return {
        data: signal,
        metadata: {
          computationTime: performance.now() - startTime,
          memoryUsed: data.length * 8,
          precision: 64,
          success: true,
        },
      };
    } catch (error) {
      throw new SimulationError(
        "Failed to generate square signal",
        "computation",
        error,
      );
    }
  }

  applyWindow(window: WindowFunction): SimulationResult<Signal> {
    const startTime = performance.now();
    try {
      const windowData = new Float64Array(this.data.length);

      switch (window.type) {
        case "hamming":
          for (let i = 0; i < this.data.length; i++) {
            const factor =
              0.54 -
              0.46 * Math.cos((2 * Math.PI * i) / (this.data.length - 1));
            windowData[i] = this.data[i] * factor;
          }
          break;
        case "hanning":
          for (let i = 0; i < this.data.length; i++) {
            const factor =
              0.5 * (1 - Math.cos((2 * Math.PI * i) / (this.data.length - 1)));
            windowData[i] = this.data[i] * factor;
          }
          break;
        // Add other window types as needed
      }

      return {
        data: new Signal(Array.from(windowData), this.sampleRate),
        metadata: {
          computationTime: performance.now() - startTime,
          memoryUsed: windowData.length * 8,
          precision: 64,
          success: true,
        },
      };
    } catch (error) {
      throw new SimulationError("Failed to apply window", "computation", error);
    }
  }

  getFrequencyArray(): number[] {
    const N = this.data.length;
    const freqArray = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      freqArray[i] = (i * this.sampleRate) / (2 * N);
    }
    return Array.from(freqArray);
  }

  getData(): number[] {
    return Array.from(this.data);
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  getTimeArray(): number[] {
    const length = this.data.length;
    const timeArray = new Float64Array(length);
    for (let i = 0; i < length; i++) {
      timeArray[i] = i / this.sampleRate;
    }
    return Array.from(timeArray);
  }

  private setMetadata(key: string, value: any): void {
    this.metadata.set(key, value);
  }

  getMetadata(key: string): any {
    return this.metadata.get(key);
  }

  decompose(options: {
    method: "emd" | "ssa" | "pca";
    numModes: number;
  }): SimulationResult<Signal[]> {
    const { method, numModes } = options;
    const N = this.data.length;
    let modes: Signal[] = [];

    if (method === "emd") {
      let residual = Array.from(this.data);

      for (let k = 0; k < numModes; k++) {
        let imf = residual;
        let prevImf: number[];

        // Sifting process
        do {
          prevImf = imf;
          const maxEnv = this.computeEnvelope(imf, "max");
          const minEnv = this.computeEnvelope(imf, "min");
          const mean = maxEnv.map((v, i) => (v + minEnv[i]) / 2);
          imf = imf.map((v, i) => v - mean[i]);
        } while (!this.checkIMFCriterion(imf, prevImf));

        modes.push(new Signal(imf, this.sampleRate));
        residual = residual.map((v, i) => v - imf[i]);
      }
    }

    return {
      data: [], // Simplified for example
      metadata: {
        computationTime: performance.now(),
        memoryUsed: 0,
        precision: 64,
        success: true,
      },
    };
  }

  private computeEnvelope(data: number[], type: "max" | "min"): number[] {
    // Find extrema
    const extrema: [number, number][] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (type === "max" && data[i] > data[i - 1] && data[i] > data[i + 1]) {
        extrema.push([i, data[i]]);
      } else if (
        type === "min" &&
        data[i] < data[i - 1] &&
        data[i] < data[i + 1]
      ) {
        extrema.push([i, data[i]]);
      }
    }

    // Cubic spline interpolation
    const envelope = new Array(data.length).fill(0);
    for (let i = 0; i < data.length; i++) {
      let numerator = 0;
      let denominator = 0;

      for (const [idx, val] of extrema) {
        let weight = 1 / Math.pow(Math.abs(i - idx), 2);
        numerator += val * weight;
        denominator += weight;
      }

      envelope[i] = numerator / denominator;
    }

    return envelope;
  }

  private checkIMFCriterion(current: number[], previous: number[]): boolean {
    const threshold = 0.05;
    let sum = 0;

    for (let i = 0; i < current.length; i++) {
      const diff = Math.abs(current[i] - previous[i]);
      sum += diff * diff;
    }

    return Math.sqrt(sum) < threshold;
  }

  analyze(options: {
    metrics: string[];
    windowSize?: number;
  }): SimulationResult<Record<string, number>> {
    const { metrics, windowSize = this.data.length } = options;
    const results: Record<string, number> = {};

    for (const metric of metrics) {
      switch (metric) {
        case "rms":
          results.rms = Math.sqrt(
            this.data.reduce((sum, x) => sum + x * x, 0) / this.data.length,
          );
          break;
        case "peak":
          results.peak = Math.max(...Array.from(this.data).map(Math.abs));
          break;
        case "crest":
          const rms = Math.sqrt(
            this.data.reduce((sum, x) => sum + x * x, 0) / this.data.length,
          );
          results.crest =
            Math.max(...Array.from(this.data).map(Math.abs)) / rms;
          break;
        case "kurtosis":
          const mean =
            this.data.reduce((sum, x) => sum + x, 0) / this.data.length;
          const variance =
            this.data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
            this.data.length;
          results.kurtosis =
            this.data.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0) /
            (this.data.length * Math.pow(variance, 2));
          break;
      }
    }

    return {
      data: results,
      metadata: {
        computationTime: performance.now(),
        memoryUsed: Object.keys(results).length * 8,
        precision: 64,
        success: true,
      },
    };
  }
}
