import React, { useState } from 'react';
import ImageFrame from './ImageFrame';
import UploadSidebar from './UploadSidebar';
import './App.css';

const ARTBOARD_WIDTH = 800;
const ARTBOARD_HEIGHT = 600;

function App() {
  const [images, setImages] = useState([]);
  const [activeImageUrl, setActiveImageUrl] = useState(null);
  const [draggingUrl, setDraggingUrl] = useState(null);

  const handleFileUpload = (file) => {
    if (file && file.type.startsWith("image/")) {
      const newUrl = URL.createObjectURL(file);
      setImages((prev) => [newUrl, ...prev]);
      setActiveImageUrl(newUrl);
    }
  };

  const handleUploadChange = (e) => {
    handleFileUpload(e.target.files[0]);
  };

  const handleDesktopDrop = (file) => {
    handleFileUpload(file);
  };

  return (
    <div className="app-container">
      <UploadSidebar
        images={images}
        onUpload={handleUploadChange}
        onImageSelect={setActiveImageUrl}
        setDraggingUrl={setDraggingUrl}
      />
      <main className="main-content">
        <div 
          className="artboard" 
          style={{ width: ARTBOARD_WIDTH, height: ARTBOARD_HEIGHT }}
        >
          <ImageFrame
            activeImageUrl={activeImageUrl}
            setActiveImageUrl={setActiveImageUrl}
            onDesktopDrop={handleDesktopDrop}
            draggingUrl={draggingUrl}
            artboardWidth={ARTBOARD_WIDTH}
            artboardHeight={ARTBOARD_HEIGHT}
          />
        </div>
      </main>
    </div>
  );
}

export default App;