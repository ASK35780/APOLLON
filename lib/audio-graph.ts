// Web Audio processing chain applied to the app's single <audio> element
// (see components/PlayerTicker.tsx) so the sound settings surfaced in
// components/SoundSettingsOverlay.tsx (equalizer, balance, mono, loudness
// normalization, volume boost, fade in/out) are real DSP, not cosmetic
// sliders.
//
// Fixed topology, built once per <audio> element (createMediaElementSource
// throws if called twice on the same element):
//
//   source -> preamp -> bass -> mid -> treble -> postEq
//     -> [mono downmix?] -> postMono
//     -> [compressor?] -> panner -> fadeGain -> destination
//
// "mono" and "compressor" are structural — their "off" state isn't a neutral
// parameter value (a compressor with default settings still audibly changes
// dynamics) — so they're toggled by disconnecting/reconnecting edges via
// setMonoActive/setCompressorActive rather than by a parameter. Every other
// stage defaults to a mathematical no-op (0dB gain, pan 0, preamp x1), so
// it's always safe to leave wired in.

export interface AudioGraph {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  preamp: GainNode;
  bass: BiquadFilterNode;
  mid: BiquadFilterNode;
  treble: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  panner: StereoPannerNode;
  fadeGain: GainNode;
  postEq: GainNode;
  postMono: GainNode;
  splitter: ChannelSplitterNode;
  monoSum: GainNode;
  merger: ChannelMergerNode;
}

export function buildAudioGraph(audio: HTMLAudioElement): AudioGraph | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const source = ctx.createMediaElementSource(audio);

  const preamp = ctx.createGain();
  preamp.gain.value = 1;

  const bass = ctx.createBiquadFilter();
  bass.type = "lowshelf";
  bass.frequency.value = 150;

  const mid = ctx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 0.9;

  const treble = ctx.createBiquadFilter();
  treble.type = "highshelf";
  treble.frequency.value = 8000;

  const compressor = ctx.createDynamicsCompressor();
  const panner = ctx.createStereoPanner();

  const fadeGain = ctx.createGain();
  fadeGain.gain.value = 1;

  const postEq = ctx.createGain();
  const postMono = ctx.createGain();

  // Mono downmix subgraph: split L/R, sum them into one channel (0.5 gain
  // keeps the level matched instead of doubling), then duplicate that mono
  // signal into both output channels.
  const splitter = ctx.createChannelSplitter(2);
  const monoSum = ctx.createGain();
  monoSum.channelCount = 1;
  monoSum.channelCountMode = "explicit";
  monoSum.channelInterpretation = "speakers";
  monoSum.gain.value = 0.5;
  const merger = ctx.createChannelMerger(2);
  splitter.connect(monoSum, 0);
  splitter.connect(monoSum, 1);
  monoSum.connect(merger, 0, 0);
  monoSum.connect(merger, 0, 1);
  merger.connect(postMono);

  source.connect(preamp);
  preamp.connect(bass);
  bass.connect(mid);
  mid.connect(treble);
  treble.connect(postEq);
  postEq.connect(postMono); // stereo passthrough by default (mono off)

  postMono.connect(panner); // compressor bypassed by default
  panner.connect(fadeGain);
  fadeGain.connect(ctx.destination);

  return { ctx, source, preamp, bass, mid, treble, compressor, panner, fadeGain, postEq, postMono, splitter, monoSum, merger };
}

export function setMonoActive(graph: AudioGraph, active: boolean) {
  graph.postEq.disconnect();
  if (active) graph.postEq.connect(graph.splitter);
  else graph.postEq.connect(graph.postMono);
}

export function setCompressorActive(graph: AudioGraph, active: boolean) {
  graph.postMono.disconnect();
  graph.compressor.disconnect();
  if (active) {
    graph.postMono.connect(graph.compressor);
    graph.compressor.connect(graph.panner);
  } else {
    graph.postMono.connect(graph.panner);
  }
}
