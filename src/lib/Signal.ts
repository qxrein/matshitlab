interface Complex {
  re: number;
  im: number;
}

export class Signal {
  private data: number[];
  private sampleRate: number;

  constructor(data: number[] = [], sampleRate: number = 1000) {
    this.data = data;
    this.sampleRate = sampleRate;
  }

  static generateSine(
    frequency: number,
    duration: number,
    sampleRate: number = 1000,
  ): Signal {
    const samples = Math.floor(duration * sampleRate);
    const data = new Array(samples)
      .fill(0)
      .map((_, i) => Math.sin((2 * Math.PI * frequency * i) / sampleRate));
    return new Signal(data, sampleRate);
  }

  static generateSquare(
    frequency: number,
    duration: number,
    sampleRate: number = 1000,
  ): Signal {
    const samples = Math.floor(duration * sampleRate);
    const data = new Array(samples).fill(0).map((_, i) => {
      const t = i / sampleRate;
      return Math.sign(Math.sin(2 * Math.PI * frequency * t));
    });
    return new Signal(data, sampleRate);
  }

  add(other: Signal): Signal {
    if (this.data.length !== other.data.length) {
      throw new Error("Signals must have the same length");
    }
    const newData = this.data.map((val, i) => val + other.data[i]);
    return new Signal(newData, this.sampleRate);
  }

  multiply(scalar: number): Signal {
    const newData = this.data.map((val) => val * scalar);
    return new Signal(newData, this.sampleRate);
  }

  private static complexMultiply(a: Complex, b: Complex): Complex {
    return {
      re: a.re * b.re - a.im * b.im,
      im: a.re * b.im + a.im * b.re,
    };
  }

  private static complexAdd(a: Complex, b: Complex): Complex {
    return {
      re: a.re + b.re,
      im: a.im + b.im,
    };
  }

  private static complexSubtract(a: Complex, b: Complex): Complex {
    return {
      re: a.re - b.re,
      im: a.im - b.im,
    };
  }

  fft(): Complex[] {
    const N = this.data.length;
    if (N <= 1) {
      return this.data.map((x) => ({ re: x, im: 0 }));
    }

    const even = new Signal(this.data.filter((_, i) => i % 2 === 0)).fft();
    const odd = new Signal(this.data.filter((_, i) => i % 2 === 1)).fft();

    const result: Complex[] = new Array(N);
    for (let k = 0; k < N / 2; k++) {
      const t: Complex = {
        re: Math.cos((-2 * Math.PI * k) / N),
        im: Math.sin((-2 * Math.PI * k) / N),
      };

      const oddK = Signal.complexMultiply(t, odd[k]);
      result[k] = Signal.complexAdd(even[k], oddK);
      result[k + N / 2] = Signal.complexSubtract(even[k], oddK);
    }
    return result;
  }

  getSpectrum(): number[] {
    const spectrum = this.fft();
    return spectrum.map((c) => Math.sqrt(c.re * c.re + c.im * c.im));
  }

  getData(): number[] {
    return this.data;
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  getTimeArray(): number[] {
    return Array.from(
      { length: this.data.length },
      (_, i) => i / this.sampleRate,
    );
  }

  getFrequencyArray(): number[] {
    const N = this.data.length;
    return Array.from({ length: N }, (_, i) => (i * this.sampleRate) / N);
  }
}
