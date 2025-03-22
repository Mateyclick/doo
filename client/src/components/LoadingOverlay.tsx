import React from 'react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-10">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm">
        <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Processing Image</h3>
        <p className="text-gray-500">Removing background. This may take a moment...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
