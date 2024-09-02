export interface MidiDevice {
  id: string;
  name: string;
  device: WebMidi.MIDIPort;
}

export type MIDIOutput = {
  id: number;
  channel: number | 'all';
  ccNumber: number;
  value: number;
  type: 'cc' | 'program' | 'sysex';
  lfo: {
    enabled: boolean;
    frequency: number;
    minAmplitude: number;
    maxAmplitude: number;
    waveform: WaveformType;
    lastRandomValue: number;
    lastUpdateTime: number;
  } | null;
}[];
export type State = {
  selectedDeviceName: string;
  midiOutputs: MIDIOutput[];
}
export interface CCMessage {
  ccNumber: number;
  value: number;
  channel: number;
}
export interface Slider {
  id: number;
  channel: number | 'all';
  ccNumber: number;
  value: number;
  type: 'cc' | 'program';
  lfo: {
    enabled: boolean;
    frequency: number;
    minAmplitude: number;
    maxAmplitude: number;
    waveform: WaveformType;
    lastRandomValue: number; 
    lastUpdateTime: number;
  } | null;

}

export type WaveformType = 'triangle' | 'ramp up' | 'ramp down' | 'square' | 'random';
export interface ProgramChange {
  programNumber: number;
  channel: number;
}
