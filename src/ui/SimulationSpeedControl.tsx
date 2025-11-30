import React, { useState } from 'react';
import { useSystemStore } from '../state/systemStore';
import './SimulationSpeedControl.css';

export const SimulationSpeedControl: React.FC = () => {
  const timeScale = useSystemStore((state) => state.timeScale);
  const setTimeScale = useSystemStore((state) => state.setTimeScale);
  
  const [inputValue, setInputValue] = useState(timeScale.toString());
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTimeScale(value);
    setInputValue(value.toFixed(2));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleInputBlur = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value)) {
      setTimeScale(value);
      setInputValue(Math.max(0, Math.min(50, value)).toFixed(2));
    } else {
      setInputValue(timeScale.toFixed(2));
    }
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };
  
  const handlePresetClick = (preset: number) => {
    setTimeScale(preset);
    setInputValue(preset.toFixed(2));
  };
  
  const getSpeedLabel = () => {
    if (timeScale === 0) return 'Paused';
    if (timeScale < 0.5) return 'Very Slow';
    if (timeScale < 1) return 'Slow';
    if (timeScale === 1) return 'Normal';
    if (timeScale <= 2) return 'Fast';
    if (timeScale <= 5) return 'Very Fast';
    if (timeScale <= 10) return 'Ultra Fast';
    if (timeScale <= 20) return 'Extreme';
    if (timeScale <= 30) return 'Ludicrous';
    return 'HYPERSPEED';
  };
  
  return (
    <div className="simulation-speed-panel">
      <div className="panel-header">
        <h2 className="panel-title">⏱️ Simulation Speed</h2>
        <span className="speed-label">{getSpeedLabel()}</span>
      </div>
      
      <div className="speed-controls">
        {/* Slider */}
        <div className="slider-container">
          <label className="control-label">
            Time Scale: <strong>{timeScale.toFixed(2)}x</strong>
          </label>
          <input
            type="range"
            className="speed-slider"
            min="0"
            max="50"
            step="0.5"
            value={timeScale}
            onChange={handleSliderChange}
          />
          <div className="slider-labels">
            <span>0</span>
            <span>1</span>
            <span>10</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>
        
        {/* Numeric Input */}
        <div className="input-container">
          <label className="control-label">Exact Value:</label>
          <input
            type="text"
            className="speed-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="0.00 - 50.00"
          />
        </div>
        
        {/* Quick Presets */}
        <div className="presets-container">
          <label className="control-label">Quick Presets:</label>
          <div className="preset-buttons">
            <button 
              className={`preset-button ${timeScale === 0 ? 'active' : ''}`}
              onClick={() => handlePresetClick(0)}
              title="Pause simulation"
            >
              ⏸️
            </button>
            <button 
              className={`preset-button ${timeScale === 0.5 ? 'active' : ''}`}
              onClick={() => handlePresetClick(0.5)}
              title="Half speed"
            >
              0.5x
            </button>
            <button 
              className={`preset-button ${timeScale === 1 ? 'active' : ''}`}
              onClick={() => handlePresetClick(1)}
              title="Normal speed"
            >
              1x
            </button>
            <button 
              className={`preset-button ${timeScale === 5 ? 'active' : ''}`}
              onClick={() => handlePresetClick(5)}
              title="5x speed"
            >
              5x
            </button>
            <button 
              className={`preset-button ${timeScale === 10 ? 'active' : ''}`}
              onClick={() => handlePresetClick(10)}
              title="10x speed"
            >
              10x
            </button>
            <button 
              className={`preset-button ${timeScale === 20 ? 'active' : ''}`}
              onClick={() => handlePresetClick(20)}
              title="20x speed"
            >
              20x
            </button>
            <button 
              className={`preset-button ${timeScale === 50 ? 'active' : ''}`}
              onClick={() => handlePresetClick(50)}
              title="Maximum speed - HYPERSPEED!"
            >
              50x 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

