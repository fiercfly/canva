import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';

const handleClasses = {
  top: 'resize-handle',
  right: 'resize-handle',
  bottom: 'resize-handle',
  left: 'resize-handle',
  topRight: 'resize-handle',
  bottomRight: 'resize-handle',
  bottomLeft: 'resize-handle',
  topLeft: 'resize-handle',
};

const resizeEnable = {
  top: true,
  right: true,
  bottom: true,
  left: true,
  topRight: true,
  bottomRight: true,
  bottomLeft: true,
  topLeft: true,
};

const INITIAL_FRAME_WIDTH = 400;
const INITIAL_FRAME_HEIGHT = 300;

function ImageFrame({ 
  activeImageUrl, 
  setActiveImageUrl, 
  onDesktopDrop, 
  draggingUrl,
  artboardWidth,
  artboardHeight
}) {
  const [frameSize, setFrameSize] = useState({ 
    width: INITIAL_FRAME_WIDTH, 
    height: INITIAL_FRAME_HEIGHT 
  });
  
  const [framePos, setFramePos] = useState({ 
    x: (artboardWidth / 2) - (INITIAL_FRAME_WIDTH / 2), 
    y: (artboardHeight / 2) - (INITIAL_FRAME_HEIGHT / 2) 
  });

  const [imageNaturalSize, setImageNaturalSize] = useState(null);
  const [imageComputedStyle, setImageComputedStyle] = useState({});
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragBounds, setDragBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  
  const innerDraggableRef = useRef(null);
  const outerDraggableRef = useRef(null);
  const resizeStartRef = useRef(null);
  
  const [isCropping, setIsCropping] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const displayUrl = (isPreviewing && draggingUrl) ? draggingUrl : activeImageUrl;

  useEffect(() => {
    if (activeImageUrl) {
      setDragPosition({ x: 0, y: 0 });
    }
    setIsCropping(false);
  }, [activeImageUrl]);

  useEffect(() => {
    if (displayUrl) {
      const img = new Image();
      img.src = displayUrl;
      img.onload = () => {
        setImageNaturalSize({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
    } else {
      setImageNaturalSize(null);
    }
  }, [displayUrl]);

  const updateImageAndBounds = useCallback(() => {
    if (!imageNaturalSize) return;
    
    const { width: fW, height: fH } = frameSize;
    const { width: iW, height: iH } = imageNaturalSize;
    const frameRatio = fW / fH;
    const imageRatio = iW / iH;
    
    let newImgStyle = {};
    let newBounds = { left: 0, top: 0, right: 0, bottom: 0 };
    
    if (imageRatio > frameRatio) {
      const calcImgWidth = iW * (fH / iH);
      newImgStyle = { height: '100%', width: 'auto', maxWidth: 'none' };
      newBounds = { top: 0, bottom: 0, left: fW - calcImgWidth, right: 0 };
    } else {
      const calcImgHeight = iH * (fW / iW);
      newImgStyle = { width: '100%', height: 'auto', maxHeight: 'none' };
      newBounds = { left: 0, right: 0, top: fH - calcImgHeight, bottom: 0 };
    }
    
    setImageComputedStyle(newImgStyle);
    setDragBounds(newBounds);
    
    if (!isCropping) {
      setDragPosition((prev) => ({
        x: Math.max(newBounds.left, Math.min(newBounds.right, prev.x)),
        y: Math.max(newBounds.top, Math.min(newBounds.bottom, prev.y)),
      }));
    }
  }, [frameSize, imageNaturalSize, isCropping]);

  useEffect(() => {
    updateImageAndBounds();
  }, [frameSize, imageNaturalSize, updateImageAndBounds]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);
  
  const handleDragEnter = useCallback((e) => {
    if (isCropping) return;
    
    const target = e.currentTarget;
    const isFileDrag = e.dataTransfer.types.includes('Files');
    
    if (draggingUrl || isFileDrag) {
      target.classList.add('drag-over');
    }
    
    // Only show image preview if dragging from sidebar
    if (draggingUrl) {
      setIsPreviewing(true);
    }
  }, [isCropping, draggingUrl]);

  const handleDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove('drag-over');
    setIsPreviewing(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (isCropping) return;
    
    e.currentTarget.classList.remove('drag-over');
    setIsPreviewing(false);
    
    const fromSidebar = e.dataTransfer.getData("imageUrl");
    if (fromSidebar) {
      setActiveImageUrl(fromSidebar);
      return;
    }
    
    const file = e.dataTransfer.files[0];
    if (file) {
      onDesktopDrop(file);
    }
  }, [isCropping, onDesktopDrop, setActiveImageUrl]);

  const onImagePan = useCallback((e, data) => {
    setDragPosition({ x: data.x, y: data.y });
  }, []);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation(); 
    if (activeImageUrl) {
      setIsCropping(true);
    }
  }, [activeImageUrl]);
  
  const finishCropping = useCallback(() => {
    const { x, y } = dragPosition;
    const { left, top, right, bottom } = dragBounds;
    setDragPosition({
      x: Math.max(left, Math.min(right, x)),
      y: Math.max(top, Math.min(bottom, y)),
    });
    setIsCropping(false);
  }, [dragPosition, dragBounds]);

  const onResizeStart = useCallback(() => {
    resizeStartRef.current = {
      pos: framePos,
      size: frameSize,
    };
  }, [framePos, frameSize]);

  const onResize = useCallback((e, direction, ref, delta) => {
    if (!resizeStartRef.current) return;

    const { pos: startPos, size: startSize } = resizeStartRef.current;
    
    const newWidth = startSize.width + delta.width;
    const newHeight = startSize.height + delta.height;
    setFrameSize({ width: newWidth, height: newHeight });

    let newX = startPos.x;
    let newY = startPos.y;
    
    if (direction.includes('left')) {
      newX = startPos.x - delta.width;
    }
    if (direction.includes('top')) {
      newY = startPos.y - delta.height;
    }
    setFramePos({ x: newX, y: newY });
  }, []);

  const dynamicFrameStyle = {
    overflow: isCropping ? 'visible' : 'hidden',
    border: isCropping ? '2px solid white' : '2px solid #6e55ff',
  };

  const frameDragBounds = {
    left: 0,
    top: 0,
    right: artboardWidth - frameSize.width,
    bottom: artboardHeight - frameSize.height,
  };

  return (
    <>
      {isCropping && createPortal(
        <div className="crop-overlay" onClick={finishCropping} />,
        document.body
      )}

      <Draggable
        nodeRef={outerDraggableRef}
        cancel={isCropping ? ".resize-handle" : ".resize-handle, .pannable-image"}
        bounds={frameDragBounds}
        disabled={isCropping}
        position={framePos}
        onDrag={(e, data) => setFramePos({ x: data.x, y: data.y })}
      >
        <div
          ref={outerDraggableRef}
          style={{
            width: frameSize.width,
            height: frameSize.height,
            position: 'absolute',
            cursor: isCropping ? 'default' : 'move',
            zIndex: isCropping ? 1001 : 'auto',
          }}
        >
          <Resizable
            className="image-frame-container"
            style={dynamicFrameStyle}
            size={{ width: '100%', height: '100%' }}
            onResizeStart={onResizeStart}
            onResize={onResize}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            handleClasses={handleClasses}
            enable={resizeEnable}
            minWidth={100}
            minHeight={100}
            maxWidth={artboardWidth}
            maxHeight={artboardHeight}
          >
            <div className="image-frame-wrapper">
              {!displayUrl && (
                <div className="image-frame-placeholder-wrapper">
                  <span className="image-frame-placeholder">
                    Drop an image here
                  </span>
                </div>
              )}

              {displayUrl && (
                <Draggable
                  nodeRef={innerDraggableRef}
                  bounds={isCropping ? undefined : dragBounds}
                  position={dragPosition}
                  onDrag={onImagePan}
                  disabled={!isCropping}
                >
                  <img
                    ref={innerDraggableRef}
                    className="pannable-image pannable-image-style" 
                    src={displayUrl}
                    style={{ 
                      ...imageComputedStyle,
                      opacity: isPreviewing ? 0.8 : 1,
                      cursor: isCropping ? 'grab' : 'default',
                    }}
                    alt="Upload"
                    draggable="false"
                    onDoubleClick={handleDoubleClick}
                  />
                </Draggable>
              )}
            </div>
          </Resizable>

          {isCropping && (
            <div className="crop-spotlight-mask" />
          )}
        </div>
      </Draggable>
    </>
  );
}

export default ImageFrame;