class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputData = input[0];
      // Convert Float32 to Int16 PCM
      const pcmData = new Int16Array(inputData.length);
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        const sample = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = sample * 0x7FFF;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / inputData.length);
      this.port.postMessage({ 
        buffer: pcmData.buffer, 
        level: rms 
      }, [pcmData.buffer]);
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
