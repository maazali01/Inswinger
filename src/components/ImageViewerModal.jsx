import { MdClose, MdZoomIn, MdZoomOut, MdDownload } from 'react-icons/md';
import { useState } from 'react';

const ImageViewerModal = ({ isOpen, onClose, imageUrl, title = 'Image Viewer' }) => {
  const [zoom, setZoom] = useState(100);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'payment-screenshot.jpg';
    link.click();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative w-full max-w-6xl">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between z-10">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg transition-colors"
              title="Zoom Out"
            >
              <MdZoomOut className="text-xl" />
            </button>
            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg transition-colors"
              title="Zoom In"
            >
              <MdZoomIn className="text-xl" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg transition-colors"
              title="Download"
            >
              <MdDownload className="text-xl" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Close"
            >
              <MdClose className="text-xl" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center min-h-[70vh] max-h-[90vh] overflow-auto">
          <img
            src={imageUrl}
            alt={title}
            style={{ transform: `scale(${zoom / 100})` }}
            className="max-w-full h-auto rounded-lg shadow-2xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;
