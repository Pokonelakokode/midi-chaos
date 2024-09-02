import React, { useState, useEffect } from 'react';

interface MidiDevice {
  id: string;
  name: string;
  device: WebMidi.MIDIPort;
}

type CCMessage = {
  ccNumber: number;
  value: number;
  channel?: number;
}

type ProgramChange = {
  programNumber: number;
  channel?: number;
}

const MaxMidiChannel = 4;

type WaveformType = 'triangle' | 'ramp up' | 'ramp down' | 'square' | 'random';

const MidiControl: React.FC = () => {
  const [midiAccess, setMidiAccess] = useState<WebMidi.MIDIAccess | null>(null);
  const [outputDevices, setOutputDevices] = useState<MidiDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MidiDevice | null>(null);
  const [sliders, setSliders] = useState<{ 
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
      lastRandomValue: number; // Add this line
    } | null;
    
  }[]>([]);
  const [nextSliderId, setNextSliderId] = useState(1);
  const [ccExceptions, setCCExceptions] = useState<{ id: number; ccNumber: number; channel: number | 'all'; }[]>([]);
  const [nextExceptionId, setNextExceptionId] = useState(1);

  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else {
      alert('WebMIDI is not supported in this browser.');
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSliders(prevSliders => prevSliders.map(slider => {
        if (slider.lfo?.enabled) {
          const now = Date.now();
          const frequency = slider.lfo.frequency;
          const minAmplitude = slider.lfo.minAmplitude;
          const maxAmplitude = slider.lfo.maxAmplitude;
          const period = 1000 / frequency; // LFO period in ms
          const phase = ((now % period) / period) * 2 * Math.PI; // Phase of LFO
          
          let lfoValue;
          switch (slider.lfo.waveform) {
            case 'ramp up':
              lfoValue = (phase / (2 * Math.PI));
              break;
            case 'ramp down':
              lfoValue = 1 - (phase / (2 * Math.PI));
              break;
            case 'square':
              lfoValue = phase < Math.PI ? 1 : 0;
              break;
              case 'random':
                // Update the random value more frequently by reducing the period
                const randomUpdateInterval = period / 10; // Increase the frequency of updates by reducing the interval
                const lastRandomUpdateTime = slider.lfo.lastUpdateTime || now;
                if (now - lastRandomUpdateTime > randomUpdateInterval) {
                  slider.lfo.lastRandomValue = Math.random(); // Update random value
                  slider.lfo.lastUpdateTime = now; // Update last update time
                }
                lfoValue = slider.lfo.lastRandomValue;
                break;
            case 'triangle':
              lfoValue = Math.abs((2 / Math.PI) * Math.asin(Math.sin(phase)));
              break;
            default:
              break;
          }
  
          const newValue = Math.floor(lfoValue * (maxAmplitude - minAmplitude) + minAmplitude);
  
          if (slider.value !== newValue) {
            const updatedSlider = { ...slider, value: newValue };
            if (selectedDevice) {
              if (updatedSlider.type === 'cc') {
                const ccMessages: CCMessage[] = createCCMessages(updatedSlider.ccNumber, newValue, updatedSlider.channel);
                sendCCMessage(ccMessages);
              } else {
                const programChangeMessages: ProgramChange[] = createProgramChangeMessages(newValue, updatedSlider.channel);
                sendProgramChange(programChangeMessages);
              }
            }
            return updatedSlider;
          }
        }
        return slider;
      }));
    }, 50);
  
    return () => clearInterval(intervalId);
  }, [sliders, selectedDevice]);

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
  
  



  const createCCMessages = (ccNumber: number, value: number, channel: number | 'all'): CCMessage[] => {
    if (channel === 'all') {
        return Array.from({ length: MaxMidiChannel }, (_, i) => i).map(ch => ({ ccNumber, value, channel: ch }));
    } else {
        return [{ ccNumber, value, channel }];
    }
};


const createProgramChangeMessages = (programNumber: number, channel: number | 'all'): ProgramChange[] => {
  if (channel === 'all') {
      return Array.from({ length: MaxMidiChannel }, (_, i) => i).map(ch => ({ programNumber, channel: ch }));
  } else {
      return [{ programNumber, channel }];
  }
};

const sendProgramChange = (messages: ProgramChange[]) => {
  if (selectedDevice) {
    console.log('sendProgramChange called with:', messages); // Log the messages

    const device = selectedDevice.device as WebMidi.MIDIOutput;
    
    device.open().then(() => {
      messages.forEach(message => {
        const statusByte = 0xC0 + (message.channel || 0);
        const programChangeMessage = [statusByte, message.programNumber];
        device.send(programChangeMessage);
        console.log('Sent Program Change message:', programChangeMessage); // Log each message sent
      });
    }).catch(error => console.error('Error sending Program Change message:', error)); // Log any errors
  }
};


  const sendCCMessage = (messages: CCMessage[]) => {
    if (selectedDevice) {
      console.log('sendCCMessage called with:', messages); // Log the messages
  
      const device = selectedDevice.device as WebMidi.MIDIOutput;
      
      device.open().then(() => {
        messages.forEach(message => {
          const statusByte = 0xB0 + (message.channel || 0);
          const controlChangeMessage = [statusByte, message.ccNumber, message.value];
          device.send(controlChangeMessage);
          console.log('Sent CC message:', controlChangeMessage); // Log each message sent
        });
      }).catch(error => console.error('Error sending CC message:', error)); // Log any errors
    }
  };
  

  const randomMessage = () => {
    const minRandomCCNumber = 1; // Minimum CC number
    const maxRandomCCNumber = 127; // Maximum CC number
    const commands: CCMessage[] = [];
    for (let midiChannel = 0; midiChannel < MaxMidiChannel; midiChannel++) {
      for (let CCNumber = minRandomCCNumber; CCNumber <= maxRandomCCNumber; CCNumber++) {
        const isExcluded = ccExceptions.some(
          (exception) => exception.ccNumber === CCNumber && (exception.channel === 'all' || exception.channel === midiChannel)
        );
        if (!isExcluded) {
          const randomValue = Math.floor(Math.random() * 128);
          commands.push({ ccNumber: CCNumber, value: randomValue, channel: midiChannel });
        }
      }
    }
    sendCCMessage(commands);
  };

  const randomProgramChange = () => {
    const minRandomProgramNumber = 1; // Minimum program number
    const maxRandomProgramNumber = 50; // Maximum program number
    const commands: ProgramChange[] = [];
    for (let midiChannel = 0; midiChannel < MaxMidiChannel; midiChannel++) {
      const randomValue = Math.floor(Math.random() * (maxRandomProgramNumber - minRandomProgramNumber + 1)) + minRandomProgramNumber;
      commands.push({ programNumber: randomValue, channel: midiChannel });
    }
    sendProgramChange(commands);
  };

  const handleAddCCException = () => {
    setCCExceptions([...ccExceptions, { id: nextExceptionId, ccNumber: 1, channel: 0 }]);
    setNextExceptionId(nextExceptionId + 1);
  };

  const handleCCExceptionNumberChange = (id: number, ccNumber: number) => {
    setCCExceptions(ccExceptions.map(exception => exception.id === id ? { ...exception, ccNumber } : exception));
  };

  const handleCCExceptionChannelChange = (id: number, channel: number | 'all') => {
    setCCExceptions(ccExceptions.map(exception => exception.id === id ? { ...exception, channel } : exception));
  };

  const handleRemoveSlider = (id: number) => {
    setSliders(sliders.filter(slider => slider.id !== id));
  };

  const handleRemoveCCException = (id: number) => {
    setCCExceptions(ccExceptions.filter(exception => exception.id !== id));
  };

  return (
    <div>
      <h2>RP-X Midi Chaos</h2>
      <select onChange={handleDeviceChange} value={selectedDevice?.id || ''}>
        <option value="">-- Choose Midi OUT --</option>
        {outputDevices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.name}
          </option>
        ))}
      </select>

      <button onClick={randomMessage} disabled={!selectedDevice}>
        Random CC Messages
      </button>
      <button onClick={randomProgramChange} disabled={!selectedDevice}>
        Random Program Changes
      </button>
      <button onClick={handleAddSlider} disabled={!selectedDevice}>
        New Slider
      </button>
      <button onClick={handleAddCCException} disabled={!selectedDevice}>
        Random CC Exceptions
      </button>

      {sliders.map(slider => (
        <div key={slider.id} style={{ marginBottom: '10px' }}>
          <label>
            Type:
            <select value={slider.type} onChange={(e) => handleTypeChange(slider.id, e.target.value as 'cc' | 'program')}>
              <option value="cc">Midi CC#</option>
              <option value="program">Program Change</option>
            </select>
          </label>

          <label>
            Midi Channel:
            <select value={slider.channel === 'all' ? 'all' : slider.channel} onChange={(e) => handleChannelChange(slider.id, e.target.value === 'all' ? 'all' : parseInt(e.target.value))}>
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
              <select value={slider.ccNumber} onChange={(e) => handleCCNumberChange(slider.id, parseInt(e.target.value))}>
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
          />
          <span style={{ marginLeft: '10px' }}>Value: {slider.value}</span>

          {/* LFO Modulation Settings */}
          
            <div>
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
                   <div>
        <label>Waveform: </label>
        <select
            value={slider.lfo.waveform}
            onChange={(e) => handleLFOChange(slider.id, true, slider.lfo.frequency, slider.lfo.minAmplitude, slider.lfo.maxAmplitude, e.target.value as WaveformType)}
        >
            <option value="triangle">Triangle</option>
            <option value="ramp up">Ramp Up</option>
            <option value="ramp down">Ramp Down</option>
            <option value="square">Square</option>
            <option value="random">Random</option>
        </select>
    </div>
                  <label>
                    
                    Frequency:
                    <input
                      type="range"
                      min="0.0001"
                      max="3"
                      step="0.0001"
                      value={slider.lfo.frequency}
                      onChange={(e) => handleLFOChange(slider.id, true, parseFloat(e.target.value), slider.lfo.minAmplitude, slider.lfo.maxAmplitude)}
                    />
                    <span style={{ marginLeft: '10px' }}>{slider.lfo.frequency}</span>
                  </label>
                  <label>
                    Min:
                    <input
                      type="range"
                      min="0"
                      max="127"
                      value={slider.lfo.minAmplitude}
                      onChange={(e) => handleLFOChange(slider.id, true, slider.lfo.frequency, parseInt(e.target.value), slider.lfo.maxAmplitude)}
                    />
                    <span style={{ marginLeft: '10px' }}>{slider.lfo.minAmplitude}</span>
                  </label>
                  <label>
                    Max:
                    <input
                      type="range"
                      min="0"
                      max="127"
                      value={slider.lfo.maxAmplitude}
                      onChange={(e) => handleLFOChange(slider.id, true, slider.lfo.frequency, slider.lfo.minAmplitude, parseInt(e.target.value))}
                    />
                    <span style={{ marginLeft: '10px' }}>{slider.lfo.maxAmplitude}</span>
                  </label>
                </div>
              )}
            </div>
            


          {/* Remove Button for Slider */}
          <button onClick={() => handleRemoveSlider(slider.id)} style={{ background: 'white', color: 'red', border: 'none', marginLeft: '12px' }}>
            X
          </button>
        </div>
      ))}

      {ccExceptions.map(exception => (
        <div key={exception.id} style={{ marginBottom: '10px' }}>
          <label>
            CC Exception Number:
            <select value={exception.ccNumber} onChange={(e) => handleCCExceptionNumberChange(exception.id, parseInt(e.target.value))}>
              {Array.from({ length: 127 }, (_, i) => i + 1).map(cc => (
                <option key={cc} value={cc}>
                  {cc}
                </option>
              ))}
            </select>
          </label>
          <label>
            Midi Channel:
            <select value={exception.channel === 'all' ? 'all' : exception.channel} onChange={(e) => handleCCExceptionChannelChange(exception.id, e.target.value === 'all' ? 'all' : parseInt(e.target.value))}>
            {Array.from({ length: MaxMidiChannel + 1 }, (_, i) => i).map(channel => (
            <option key={channel} value={channel === MaxMidiChannel ? 'all' : channel}>
            {channel === MaxMidiChannel ? 'ALL' : channel}
            </option>
            ))}
            </select>

          </label>
          
          {/* Remove Button for CC Exception */}
          <button onClick={() => handleRemoveCCException(exception.id)} style={{ background: 'white', color: 'red', border: 'none', marginLeft: '12px' }}>
            X
          </button>
        </div>
      ))}
    </div>
  );
};

export default MidiControl;
