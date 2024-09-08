import React from 'react';
import styles from './MidiSlider.module.scss'; // Assuming you have a corresponding SCSS module
import HideIcon from '../shared/icons/HideIcon/HideIcon';

// interface LFO {
//   enabled: boolean;
//   frequency: number;
//   minAmplitude: number;
//   maxAmplitude: number;
//   waveform: WaveformType;
// }

interface Slider {
  id: number;
  type: 'cc' | 'program';
  channel: number | 'all';
  ccNumber?: number;
  value: number;
}

interface MidiSliderProps {
  slider: Slider;
  MaxMidiChannel: number;
  handleTypeChange: (id: number, type: 'cc' | 'program') => void;
  handleChannelChange: (id: number, channel: number | 'all') => void;
  handleCCNumberChange: (id: number, ccNumber: number) => void;
  handleSliderChange: (id: number, value: number) => void;
  //   handleLFOChange: (id: string, enabled: boolean, frequency: number, minAmplitude: number, maxAmplitude: number, waveform?: WaveformType) => void;
  handleRemoveSlider: (id: number) => void;
}

const MidiSlider: React.FC<MidiSliderProps> = ({
  slider,
  MaxMidiChannel,
  handleTypeChange,
  handleChannelChange,
  handleCCNumberChange,
  handleSliderChange,
  handleRemoveSlider
}) => {
  const [hideSettings, setHideSettings] = React.useState(false);
  return (
    <div className={styles.sliderContainer}>
      <HideIcon className={styles.hideButton} onClick={() => setHideSettings(!hideSettings)} hidden={hideSettings} />
      
      {!hideSettings && <div>
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
      </div>}


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
      {/* <div className={styles.lfoSettings}>
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
      </div> */}

      {/* Remove Button for Slider */}
      <button onClick={() => handleRemoveSlider(slider.id)} className={styles.removeButton}>
        X
      </button>
    </div>
  );
};

export default MidiSlider;