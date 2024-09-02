import React, { useState, useEffect } from 'react';
import styles from './MidiControl.module.scss';
import useMidiHelpers from './midiUtils';
import { MidiDevice, CCMessage, ProgramChange, WaveformType } from '../types/types';

const MaxMidiChannel = 4;



const MidiControl: React.FC = () => {
  const [midiAccess, setMidiAccess] = useState<WebMidi.MIDIAccess | null>(null);
  const [outputDevices, setOutputDevices] = useState<MidiDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MidiDevice | null>(null);
  const [nextSliderId, setNextSliderId] = useState(1);
  const {
    ccExceptions,
    createCCMessages,
    createProgramChangeMessages,
    sendProgramChange,
    sendCCMessage,
    randomMessage,
    randomProgramChange,
    handleAddCCException,
    handleCCExceptionNumberChange,
    handleCCExceptionChannelChange,
    handleRemoveSlider,
    handleRemoveCCException,
    setCCExceptions,
    setNextExceptionId,
    sliders,
    setSliders
  } = useMidiHelpers(selectedDevice);
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else {
      alert('WebMIDI is not supported in this browser.');
    }
  }, []);


  const onMIDISuccess = (midi: WebMidi.MIDIAccess) => {
    setMidiAccess(midi);
    const outputs: MidiDevice[] = [];

    midi.outputs.forEach((output) => {
      outputs.push({
        id: output.id,
        name: output.name || 'Unknown Device',
        device: output,
      });
    });

    setOutputDevices(outputs);
  };

  const onMIDIFailure = () => {
    console.error('Could not access your MIDI devices.');
  };

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = event.target.value;
    const device = outputDevices.find((d) => d.id === deviceId) || null;
    setSelectedDevice(device);
  };

  const handleAddSlider = () => {
    setSliders([...sliders, { id: nextSliderId, channel: 0, ccNumber: 1, value: 0, type: 'cc', lfo: null }]);
    setNextSliderId(nextSliderId + 1);
  };

  const handleSliderChange = (id: number, value: number) => {
    setSliders(sliders.map(slider => slider.id === id ? { ...slider, value } : slider));
    const slider = sliders.find((s) => s.id === id);
    if (slider && selectedDevice) {
      if (slider.type === 'cc') {
        const ccMessages: CCMessage[] = createCCMessages(slider.ccNumber, value, slider.channel);
        sendCCMessage(ccMessages);
      } else {
        const programChangeMessages: ProgramChange[] = createProgramChangeMessages(value, slider.channel);
        sendProgramChange(programChangeMessages);
      }
    }
  };

  const handleChannelChange = (id: number, channel: number | 'all') => {
    setSliders(sliders.map(slider => slider.id === id ? { ...slider, channel } : slider));
  };

  const handleCCNumberChange = (id: number, ccNumber: number) => {
    setSliders(sliders.map(slider => slider.id === id ? { ...slider, ccNumber } : slider));
  };

  const handleTypeChange = (id: number, type: 'cc' | 'program') => {
    setSliders(sliders.map(slider => slider.id === id ? { ...slider, type, value: 0 } : slider));
  };

  const handleLFOChange = (id: number, enabled: boolean, frequency: number, minAmplitude: number, maxAmplitude: number, waveform?: WaveformType) => {
    setSliders(sliders.map(slider => 
      slider.id === id 
        ? { 
            ...slider, 
            lfo: { 
              enabled, 
              frequency, 
              minAmplitude, 
              maxAmplitude, 
              waveform: waveform || slider.lfo?.waveform || 'triangle',
              lastRandomValue: slider.lfo?.lastRandomValue || Math.random(),
              lastUpdateTime: slider.lfo?.lastUpdateTime || Date.now(), // Initialize lastUpdateTime
            } 
          } 
        : slider
    ));
  };
  
  



  return (
    <div className={styles.container}>
      <h2>RP-X Midi Chaos</h2>
      <select onChange={handleDeviceChange} value={selectedDevice?.id || ''} className={styles.select}>
        <option value="">-- Choose Midi OUT --</option>
        {outputDevices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.name}
          </option>
        ))}
      </select>

      <button onClick={randomMessage} disabled={!selectedDevice} className={styles.button}>
        Random CC Messages
      </button>
      <button onClick={randomProgramChange} disabled={!selectedDevice} className={styles.button}>
        Random Program Changes
      </button>
      <button onClick={handleAddSlider} disabled={!selectedDevice} className={styles.button}>
        New Slider
      </button>
      <button onClick={handleAddCCException} disabled={!selectedDevice} className={styles.button}>
        Random CC Exceptions
      </button>

      {sliders?.map(slider => (
        <div key={slider.id} className={styles.sliderContainer}>
          <label>
            Type:
            <select value={slider.type} onChange={(e) => handleTypeChange(slider.id, e.target.value as 'cc' | 'program')} className={styles.select}>
              <option value="cc">Midi CC#</option>
              <option value="program">Program Change</option>
            </select>
          </label>

          <label>
            Midi Channel:
            <select value={slider.channel === 'all' ? 'all' : slider.channel} onChange={(e) => handleChannelChange(slider.id, e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className={styles.select}>
              {Array.from({ length: MaxMidiChannel + 1 }, (_, i) => i).map(channel => (
                <option key={channel} value={channel === MaxMidiChannel ? 'all' : channel}>
                  {channel === MaxMidiChannel ? 'ALL' : channel}
                </option>
              ))}
            </select>
          </label>

          {slider.type === 'cc' && (
            <label>
              CC Number:
              <select value={slider.ccNumber} onChange={(e) => handleCCNumberChange(slider.id, parseInt(e.target.value))} className={styles.select}>
                {Array.from({ length: 127 }, (_, i) => i + 1).map(cc => (
                  <option key={cc} value={cc}>
                    {cc}
                  </option>
                ))}
              </select>
            </label>
          )}

          <input
            type="range"
            min="0"
            max={slider.type === 'cc' ? 127 : 127}
            value={slider.value}
            onChange={(e) => handleSliderChange(slider.id, parseInt(e.target.value))}
            className={styles.range}
          />
          <span className={styles.value}>Value: {slider.value}</span>

          {/* LFO Modulation Settings */}
          <div className={styles.lfoSettings}>
            <label>
              LFO:
              <input
                type="checkbox"
                checked={!!slider.lfo?.enabled}
                onChange={(e) => handleLFOChange(slider.id, e.target.checked, slider.lfo?.frequency || 0.01, slider.lfo?.minAmplitude || 0, slider.lfo?.maxAmplitude || 127)}
              />
            </label>
            {slider.lfo?.enabled && (
              <div>
                <div className={styles.waveformSelect}>
                  <label>Waveform: </label>
                  <select
                    value={slider.lfo.waveform}
                    onChange={(e) => handleLFOChange(slider.id, true, slider.lfo.frequency, slider.lfo.minAmplitude, slider.lfo.maxAmplitude, e.target.value as WaveformType)}
                    className={styles.select}
                  >
                    <option value="triangle">Triangle</option>
                    <option value="ramp up">Ramp Up</option>
                    <option value="ramp down">Ramp Down</option>
                    <option value="square">Square</option>
                    <option value="random">Random</option>
                  </select>
                </div>
                <label className={styles.frequency}>
                  Frequency:
                  <input
                    type="range"
                    min="0.0001"
                    max="3"
                    step="0.0001"
                    value={slider.lfo.frequency}
                    onChange={(e) => handleLFOChange(slider.id, true, parseFloat(e.target.value), slider.lfo.minAmplitude, slider.lfo.maxAmplitude)}
                    className={styles.range}
                  />
                  <span>{slider.lfo.frequency}</span>
                </label>
                <label className={styles.minAmplitude}>
                  Min:
                  <input
                    type="range"
                    min="0"
                    max="127"
                    value={slider.lfo.minAmplitude}
                    onChange={(e) => handleLFOChange(slider.id, true, slider.lfo.frequency, parseInt(e.target.value), slider.lfo.maxAmplitude)}
                    className={styles.range}
                  />
                  <span>{slider.lfo.minAmplitude}</span>
                </label>
                <label className={styles.maxAmplitude}>
                  Max:
                  <input
                    type="range"
                    min="0"
                    max="127"
                    value={slider.lfo.maxAmplitude}
                    onChange={(e) => handleLFOChange(slider.id, true, slider.lfo.frequency, slider.lfo.minAmplitude, parseInt(e.target.value))}
                    className={styles.range}
                  />
                  <span>{slider.lfo.maxAmplitude}</span>
                </label>
              </div>
            )}
          </div>

          {/* Remove Button for Slider */}
          <button onClick={() => handleRemoveSlider(slider.id)} className={styles.removeButton}>
            X
          </button>
        </div>
      ))}

      {ccExceptions?.map(exception => (
        <div key={exception.id} className={styles.ccExceptionContainer}>
          <label>
            CC Exception Number:
            <select value={exception.ccNumber} onChange={(e) => handleCCExceptionNumberChange(exception.id, parseInt(e.target.value))} className={styles.select}>
              {Array.from({ length: 127 }, (_, i) => i + 1).map(cc => (
                <option key={cc} value={cc}>
                  {cc}
                </option>
              ))}
            </select>
          </label>
          <label>
            Midi Channel:
            <select value={exception.channel === 'all' ? 'all' : exception.channel} onChange={(e) => handleCCExceptionChannelChange(exception.id, e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className={styles.select}>
              {Array.from({ length: MaxMidiChannel + 1 }, (_, i) => i).map(channel => (
                <option key={channel} value={channel === MaxMidiChannel ? 'all' : channel}>
                  {channel === MaxMidiChannel ? 'ALL' : channel}
                </option>
              ))}
            </select>
          </label>

          {/* Remove Button for CC Exception */}
          <button onClick={() => handleRemoveCCException(exception.id)} className={styles.removeButton}>
            X
          </button>
        </div>
      ))}
    </div>
  );
};

export default MidiControl;
