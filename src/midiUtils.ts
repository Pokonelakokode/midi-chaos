import { useState, useCallback } from 'react';
import { ProgramChange, CCMessage, Slider, CCException } from '../types/types'; // Import the types for Program Change and CC messages

const MaxMidiChannel = 4; // Define the maximum number of MIDI channels

const useMidiHelpers = (selectedDevice: any) => {
  const [ccExceptions, setCCExceptions] = useState< CCException[]>([]);
  const [nextExceptionId, setNextExceptionId] = useState(1);
  const [sliders, setSliders] = useState<Slider[]>([]); // Replace 'any' with the appropriate type for sliders

  const createCCMessages = useCallback((ccNumber: number, value: number, channel: number | 'all'): CCMessage[] => {
    if (channel === 'all') {
      return Array.from({ length: MaxMidiChannel }, (_, i) => i).map(ch => ({ ccNumber, value, channel: ch }));
    } else {
      return [{ ccNumber, value, channel }];
    }
  }, []);

  const createProgramChangeMessages = useCallback((programNumber: number, channel: number | 'all'): ProgramChange[] => {
    if (channel === 'all') {
      return Array.from({ length: MaxMidiChannel }, (_, i) => i).map(ch => ({ programNumber, channel: ch }));
    } else {
      return [{ programNumber, channel }];
    }
  }, []);

  const sendProgramChange = useCallback((messages: ProgramChange[]) => {
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
  }, [selectedDevice]);

  const sendCCMessage = useCallback((messages: CCMessage[]) => {
    if (selectedDevice) {
      console.log('sendCCMessage called with:', messages); // Log the messages
  
      const device = selectedDevice.device as WebMidi.MIDIOutput;
      
      device.open().then(() => {
        messages.forEach(message => {
          const statusByte = 0xB0 + (message.channel || 0);
          const controlChangeMessage = [statusByte, message.ccNumber, message.value];
          device.send(controlChangeMessage);
        });
      }).catch(error => console.error('Error sending CC message:', error)); // Log any errors
    }
  }, [selectedDevice]);

  const randomMessage = useCallback(() => {
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
  }, [ccExceptions, sendCCMessage]);

  const randomProgramChange = useCallback(() => {
    const minRandomProgramNumber = 1; // Minimum program number
    const maxRandomProgramNumber = 50; // Maximum program number
    const commands: ProgramChange[] = [];
    for (let midiChannel = 0; midiChannel < MaxMidiChannel; midiChannel++) {
      const randomValue = Math.floor(Math.random() * (maxRandomProgramNumber - minRandomProgramNumber + 1)) + minRandomProgramNumber;
      commands.push({ programNumber: randomValue, channel: midiChannel });
    }
    sendProgramChange(commands);
  }, [sendProgramChange]);

  const handleAddCCException = useCallback(() => {
    setCCExceptions(prev => [...prev, { id: nextExceptionId, ccNumber: 1, channel: 0 }]);
    setNextExceptionId(prev => prev + 1);
  }, [nextExceptionId]);

  const handleCCExceptionNumberChange = useCallback((id: number, ccNumber: number) => {
    setCCExceptions(prev => prev.map(exception => exception.id === id ? { ...exception, ccNumber } : exception));
  }, []);

  const handleCCExceptionChannelChange = useCallback((id: number, channel: number | 'all') => {
    setCCExceptions(prev => prev.map(exception => exception.id === id ? { ...exception, channel } : exception));
  }, []);

  const handleRemoveSlider = useCallback((id: number) => {
    setSliders(prev => prev.filter(slider => slider.id !== id));
  }, []);

  const handleRemoveCCException = useCallback((id: number) => {
    setCCExceptions(prev => prev.filter(exception => exception.id !== id));
  }, []);

  return {
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
  };
};

export default useMidiHelpers;