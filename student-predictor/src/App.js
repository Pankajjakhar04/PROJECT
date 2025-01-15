import React, { useRef } from "react";
import "./App.css";
import PredictionForm from "./PredictionForm";

const App = () => {
  const videoRef = useRef();

  const handlePredict = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen?.(); // Trigger fullscreen if supported
      videoRef.current.play(); // Play the video
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">Student Performance Predictor</h1>
        <div className="App-content">
          <video ref={videoRef} src="your-video-url.mp4" style={{ display: "none" }} />
          <PredictionForm onPredict={handlePredict} />
        </div>
      </header>
    </div>
  );
};

export default App;
