import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppContext } from '@/contexts/AppContext';
import { removeBg } from '@/lib/removeBg';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as fabric from 'fabric';

const ImageUploader: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [brushSize, setBrushSize] = useState(20);
  const [mode, setMode] = useState<'eraser' | 'restore'>('eraser');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Por favor sube una imagen válida (JPG, PNG)",
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "Por favor sube una imagen menor a 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Create URL for original image preview
    const originalUrl = URL.createObjectURL(file);
    
    dispatch({ type: 'SET_UPLOADED_IMAGE', payload: file });
    dispatch({ type: 'SET_ORIGINAL_IMAGE', payload: originalUrl });
    
    // Process image
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const processedImageUrl = await removeBg(file);
      
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: processedImageUrl });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to process image' 
      });
    }
  }, [dispatch, toast]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    maxFiles: 1
  });

  useEffect(() => {
    // Initialize fabric canvas when processed image is available
    if (state.processedImageUrl && canvasRef.current) {
      try {
        if (!fabricCanvasRef.current) {
          fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);
          dispatch({ type: 'SET_FABRIC_CANVAS', payload: fabricCanvasRef.current });
        }
        
        const canvas = fabricCanvasRef.current;
        canvas.clear();
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            canvas.setWidth(img.width || 400);
            canvas.setHeight(img.height || 400);
            
            const fabricImage = new fabric.Image(img);
            
            // Scale image to fit canvas
            const scale = Math.min(
              canvas.width! / (img.width || 1),
              canvas.height! / (img.height || 1)
            );
            
            fabricImage.scale(scale);
            canvas.add(fabricImage);
            canvas.centerObject(fabricImage);
            canvas.renderAll();
          } catch (error) {
            console.error("Error setting up canvas image:", error);
          }
        };
        
        img.src = state.processedImageUrl;
      } catch (error) {
        console.error("Error initializing canvas:", error);
      }
    }
    
    return () => {
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
          fabricCanvasRef.current = null;
        } catch (error) {
          console.error("Error disposing canvas:", error);
        }
      }
    };
  }, [state.processedImageUrl, dispatch]);

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setBrushSize(newSize);
    if (fabricCanvasRef.current && fabricCanvasRef.current.freeDrawingBrush) {
      try {
        fabricCanvasRef.current.freeDrawingBrush.width = newSize;
      } catch (error) {
        console.error("Error changing brush size:", error);
      }
    }
  };

  const enableEraser = () => {
    if (fabricCanvasRef.current) {
      setMode('eraser');
      const canvas = fabricCanvasRef.current;
      canvas.isDrawingMode = true;
      
      // Workaround for EraserBrush issue - use PencilBrush with transparency
      try {
        // Use default brush with transparent color
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = 'rgba(0, 0, 0, 0)'; // Transparent "erase"
          canvas.freeDrawingBrush.width = brushSize;
        }
      } catch (error) {
        console.error("Error setting eraser brush:", error);
      }
    }
  };

  const enableRestore = () => {
    if (fabricCanvasRef.current) {
      setMode('restore');
      const canvas = fabricCanvasRef.current;
      canvas.isDrawingMode = true;
      
      try {
        // Use default brush with black color to restore content
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = brushSize;
          canvas.freeDrawingBrush.color = 'rgba(0,0,0,1)';
        }
      } catch (error) {
        console.error("Error setting restore brush:", error);
      }
    }
  };

  const resetImage = async () => {
    if (state.uploadedImage) {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const processedImageUrl = await removeBg(state.uploadedImage);
        dispatch({ type: 'SET_PROCESSED_IMAGE', payload: processedImageUrl });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to process image' 
        });
      }
    }
  };

  const handleProceed = () => {
    if (!state.processedImageUrl) {
      toast({
        title: "No hay imagen seleccionada",
        description: "Por favor sube y procesa una imagen primero",
        variant: "destructive"
      });
      return;
    }
    
    // Save the current canvas state as the processed image
    if (fabricCanvasRef.current) {
      try {
        // Generate a data URL from the canvas
        const dataUrl = fabricCanvasRef.current.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1
        });
        
        // Use the data URL as the processed image
        dispatch({ type: 'SET_PROCESSED_IMAGE', payload: dataUrl });
        
        // Move to the next step
        dispatch({ type: 'SET_STEP', payload: 2 });
      } catch (error) {
        console.error("Error generating final image:", error);
        toast({
          title: "Error al procesar la imagen",
          description: "Hubo un problema al preparar la imagen. Por favor intenta de nuevo.",
          variant: "destructive"
        });
      }
    } else {
      // If canvas is not available, just move to next step with current processed image
      dispatch({ type: 'SET_STEP', payload: 2 });
    }
  };

  return (
    <div>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Subir y Eliminar Fondo</h2>
        
        {!state.processedImageUrl ? (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed ${isDragActive ? 'border-primary' : 'border-gray-300'} rounded-lg p-8 text-center cursor-pointer`}
          >
            <div className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 mb-2">Arrastra y suelta tu imagen aquí</p>
              <p className="text-gray-500 text-sm mb-4">o</p>
              <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors">
                Buscar Archivos
              </button>
              <input {...getInputProps()} />
              <p className="text-gray-500 text-xs mt-3">Soporta archivos JPG, PNG</p>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col sm:flex-row gap-6">
            <div className="flex-1 border rounded-lg overflow-hidden">
              {state.originalImageUrl && (
                <div className="bg-gray-100 aspect-square flex items-center justify-center">
                  <img 
                    src={state.originalImageUrl} 
                    alt="Original" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
            <div className="flex-1 border rounded-lg overflow-hidden">
              <div className="bg-gray-100 aspect-square flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full max-h-full"></canvas>
              </div>
            </div>
          </div>
        )}
        
        {state.processedImageUrl && (
          <div className="mt-6">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium mb-2">Retoque Manual</h3>
              <p className="text-gray-600 mb-4">Refina la eliminación del fondo con la herramienta de borrador</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                <button 
                  className={`${mode === 'eraser' ? 'bg-primary text-white' : 'bg-white text-gray-600'} border rounded-md py-2 px-3 text-sm flex items-center gap-2 hover:bg-gray-50 hover:text-gray-800`}
                  onClick={enableEraser}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 20H9L4 15L15 4L21 10L20 20Z"></path>
                  </svg>
                  <span>Borrador</span>
                </button>
                <button 
                  className={`${mode === 'restore' ? 'bg-primary text-white' : 'bg-white text-gray-600'} border rounded-md py-2 px-3 text-sm flex items-center gap-2 hover:bg-gray-50 hover:text-gray-800`}
                  onClick={enableRestore}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="M2 2l7.586 7.586"></path>
                    <path d="M11 11L13 13"></path>
                  </svg>
                  <span>Restaurar</span>
                </button>
                <button 
                  className="bg-white border rounded-md py-2 px-3 text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-600 hover:text-gray-800"
                  onClick={resetImage}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  <span>Reiniciar</span>
                </button>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tamaño del Pincel: {brushSize}px</label>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={brushSize} 
                  onChange={handleBrushSizeChange}
                  className="w-full" 
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t px-6 py-4 flex justify-end">
        <Button 
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md font-medium transition-colors"
          onClick={handleProceed}
          disabled={!state.processedImageUrl}
        >
          Siguiente: Elegir Plantilla
        </Button>
      </div>
    </div>
  );
};

export default ImageUploader;
