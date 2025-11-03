
import React from 'react';

function UploadSidebar({ images, onUpload, onImageSelect, setDraggingUrl }) {

  const handleDragStart = (e, url) => {
    e.dataTransfer.setData("imageUrl", url);
    setDraggingUrl(url); 
  };
  
  const handleDragEnd = () => {
    setDraggingUrl(null); 
  };

  return (
    <div className="sidebar">
      <label htmlFor="file-upload" className="upload-button-label">
        Upload files
      </label>
      <input 
        id="file-upload"
        type="file" 
        accept="image/*" 
        onChange={onUpload} 
        className="upload-input-hidden"
        multiple
      />
      
      <p>Click or drag an image to the frame.</p>

      <div className="thumbnail-gallery">
        {images.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Uploaded ${index + 1}`}
            className="thumbnail"
            onClick={() => onImageSelect(url)}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, url)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

export default UploadSidebar;