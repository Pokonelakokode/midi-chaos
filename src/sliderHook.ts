import { useEffect } from 'react';
import { Slider, CCMessage, ProgramChange } from '../types/types'; // Adjust the import paths as needed

interface UseLfoUpdateProps {
  sliders: Slider[];
  setSliders: React.Dispatch<React.SetStateAction<Slider[]>>;
  selectedDevice: any; // Replace 'any' with the appropriate type for selectedDevice
}

const useLfoUpdate = ({ sliders, setSliders, selectedDevice }: UseLfoUpdateProps) => {
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
              lfoValue = 1;
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
};

export default useLfoUpdate;