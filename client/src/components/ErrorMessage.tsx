import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';

const ErrorMessage: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const handleDismissError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  if (!state.error) return null;

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error processing image</h3>
          <div className="mt-1 text-sm text-red-700">
            <p>{state.error}</p>
          </div>
          <div className="mt-3">
            <Button 
              variant="outline"
              className="inline-flex items-center px-3 py-1.5 border border-red-700 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
              onClick={handleDismissError}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
