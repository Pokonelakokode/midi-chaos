import React, { useState, useEffect } from 'react';
import styles from './MidiControl.module.scss';
import useMidiHelpers from './midiUtils';
import { MidiDevice, CCMessage, ProgramChange, WaveformType } from '../types/types';
import MidiSlider from './components/MidiSlider/MidiSlider';

const MaxMidiChannel = 4;



const MidiControl: React.FC = () => {
  const [midiAccess, setMidiAccess] = useState<WebMidi.MIDIAccess | null>(null);
  const [outputDevices, setOutputDevices] = useState<MidiDevice[]>([]);
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
    setSliders,
    selectedDevice,
    setSelectedDevice
  } = useMidiHelpers();
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else {
      alert('WebMIDI is not supported in this browser.');
    }
  }, []);
  const saveStateToLocalStorage = () => {
    const state = {
      selectedDevice: selectedDevice?.name,
      sliders,
      ccExceptions
    };
    localStorage.setItem('midiControlState', JSON.stringify(state));
  };
  const loadStateFromLocalStorage = () => {
    const state = localStorage.getItem('midiControlState');
    if (state) {
      const { selectedDevice, sliders, ccExceptions } = JSON.parse(state);
      handleDeviceChange(selectedDevice);
      setSliders(sliders);
      setCCExceptions(ccExceptions);
    }
  };
  // useEffect(() => {
  //   saveStateToLocalStorage();
  // }, [selectedDevice, sliders, ccExceptions]);

  

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

  const handleDeviceChange = (deviceId: string) => {
    const device = outputDevices.find((d) => d.name === deviceId) || null;
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
      <div className={styles.saveLoadContainer}>
      
        <button onClick={saveStateToLocalStorage} className={styles.saveButton}>
          Save State
        </button>
        <button onClick={() => loadStateFromLocalStorage()} className={styles.loadButton}>
          Load State
        </button>
      </div>
      <h2>RP-X Midi Chaos</h2>
      <select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleDeviceChange(e.target.value)} value={selectedDevice?.name || ''} className={styles.select}>
        <option value="">-- Choose Midi OUT --</option>
        {outputDevices.map((device) => (
          <option key={device.name} value={device.name}>
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
      <div className={styles.sliderContainer}>
        {sliders.map(slider => 
          <MidiSlider
            key={slider.id}
            slider={slider}
            MaxMidiChannel={MaxMidiChannel}
            handleTypeChange={handleTypeChange}
            handleChannelChange={handleChannelChange}
            handleCCNumberChange={handleCCNumberChange}
            handleSliderChange={handleSliderChange}
            handleRemoveSlider={handleRemoveSlider}
          />
        )}
      </div>
      

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
