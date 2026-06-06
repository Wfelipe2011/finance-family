export type RecorderHandle = {
  stop: () => Promise<File>;
};

export async function startWavRecording(): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const preferred = MediaRecorder.isTypeSupported("audio/wav") ? "audio/wav" : "audio/webm";
  const recorder = new MediaRecorder(stream, { mimeType: preferred });
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  recorder.start();

  return {
    stop: () =>
      new Promise<File>((resolve) => {
        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(chunks, { type: preferred });
          const wav = preferred === "audio/wav" ? blob : await convertBlobToWav(blob);
          resolve(new File([wav], `finai-${Date.now()}.wav`, { type: "audio/wav" }));
        };
        recorder.stop();
      }),
  };
}

async function convertBlobToWav(blob: Blob) {
  const audioContext = new AudioContext();
  const buffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
  const wav = encodeWav(buffer);
  await audioContext.close();
  return new Blob([wav], { type: "audio/wav" });
}

function encodeWav(buffer: AudioBuffer) {
  const samples = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}
