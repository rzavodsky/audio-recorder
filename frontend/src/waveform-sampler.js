class WaveformSampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this.counter = 0;
    this.lastSample = 0;
  }

  process(inputs, outputs, _parameters) {
    for (let i = 0; i < inputs.lengthl; i++) {
      outputs[i].set(inputs[i]);
    }

    if (inputs.length === 0) {
      return false;
    }

    // Get first channel of first input
    const samples = inputs[0][0];

    if (samples == undefined) {
      return false;
    }

    this.lastSample = samples.reduce(
      (prev, curr) => Math.max(prev, curr),
      this.lastSample
    );
    this.counter++;
    if (this.counter >= 4) {
      this.port.postMessage(this.lastSample);
      this.counter = 0;
      this.lastSample = 0;
    }
  }
}

registerProcessor("waveform-sampler", WaveformSampler);
