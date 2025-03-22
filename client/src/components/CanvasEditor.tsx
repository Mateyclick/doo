
import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { TemplateType } from '@/types';
import { createFabricCanvas, loadImageOntoCanvas } from '@/lib/fabricSetup';
import { CANVAS_DIMENSIONS } from '@/config';
import * as fabric from 'fabric';

interface CanvasEditorProps {
  templates: TemplateType[];
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ templates }) => {
  const { state, dispatch } = useAppContext();
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_DIMENSIONS.width);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_DIMENSIONS.height);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [productImageObj, setProductImageObj] = useState<fabric.Image | null>(null);
  const [selectedBackground, setSelectedBackground] = useState('#FFFFFF');

  // Initialize canvas when component mounts
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      console.log('Initializing Fabric.js canvas in CanvasEditor');
      const canvas = createFabricCanvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: selectedBackground
      });
      
      fabricCanvasRef.current = canvas;
      dispatch({ type: 'SET_FABRIC_CANVAS', payload: canvas });
      
      // Auto-select first template if none is selected
      if (!state.selectedTemplate && templates.length > 0) {
        dispatch({ type: 'SET_TEMPLATE', payload: templates[0] });
      }
    }

    // Handle resize
    const handleResize = () => {
      if (canvasContainerRef.current && fabricCanvasRef.current) {
        const container = canvasContainerRef.current;
        const containerWidth = container.clientWidth;
        
        // Maintain 9:16 aspect ratio for Instagram Stories (1080x1920), limited by container width
        const newHeight = containerWidth * (1920/1080);
        
        setCanvasWidth(containerWidth);
        setCanvasHeight(newHeight);
        
        fabricCanvasRef.current.setDimensions({
          width: containerWidth,
          height: newHeight
        });
        fabricCanvasRef.current.renderAll();
      }
    };

    // Initial sizing
    handleResize();

    // Setup resize listener
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dispatch, templates, state.selectedTemplate, canvasWidth, canvasHeight, selectedBackground]);

  // When template or processed image changes, update the canvas
  useEffect(() => {
    if (fabricCanvasRef.current && state.selectedTemplate && state.processedImageUrl) {
      console.log('Updating canvas with template and image');
      const canvas = fabricCanvasRef.current;
      canvas.clear();
      
      // Set canvas background color using the property directly
      canvas.backgroundColor = selectedBackground;
      canvas.renderAll();

      // First, load the template as background
      loadImageOntoCanvas(canvas, state.selectedTemplate.path, {
        selectable: false,
        x: 0.5,
        y: 0.5
      }).then(() => {
        // Then, load the product image
        loadImageOntoCanvas(canvas, state.processedImageUrl!, {
          x: state.imagePosition.x,
          y: state.imagePosition.y,
          angle: state.imagePosition.angle || 0,
          scale: state.imagePosition.scale || 1,
          selectable: true
        }).then((img) => {
          setProductImageObj(img);
          
          // Listen for object modifications to update state
          img.on('modified', function() {
            if (canvas.width && canvas.height) {
              dispatch({
                type: 'SET_IMAGE_POSITION',
                payload: {
                  x: img.left! / canvas.width,
                  y: img.top! / canvas.height,
                  angle: img.angle || 0,
                  scale: img.scaleX || 1, // Store the scale multiplier
                }
              });
            }
          });
        });
      });
    }
  }, [state.selectedTemplate, state.processedImageUrl, dispatch, selectedBackground]);

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sizePercent = parseFloat(e.target.value);
    
    if (productImageObj && fabricCanvasRef.current) {
      const scaleFactor = sizePercent / 50; // 50 = default size (100%)
      
      productImageObj.scale(scaleFactor);
      
      dispatch({
        type: 'SET_IMAGE_POSITION',
        payload: {
          scale: scaleFactor
        }
      });
      
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rotation = parseInt(e.target.value);
    
    if (productImageObj && fabricCanvasRef.current) {
      productImageObj.set({ angle: rotation });
      
      dispatch({
        type: 'SET_IMAGE_POSITION',
        payload: { angle: rotation }
      });
      
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleSelectTemplate = (template: TemplateType) => {
    dispatch({ type: 'SET_TEMPLATE', payload: template });
  };

  const handleBackgroundColor = (color: string) => {
    setSelectedBackground(color);
    
    if (fabricCanvasRef.current) {
      // Update the backgroundColor property directly
      fabricCanvasRef.current.backgroundColor = color;
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleGoBack = () => {
    dispatch({ type: 'SET_STEP', payload: 1 });
  };

  const handleProceed = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  return (
    <div>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Elige Plantilla y Posiciona la Imagen</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2">
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <div 
                ref={canvasContainerRef} 
                className="relative bg-white overflow-hidden rounded-lg shadow-sm aspect-[9/16]"
              >
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full"
                ></canvas>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium mb-3">Controles de Imagen</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tamaño</label>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={state.imagePosition.scale ? state.imagePosition.scale * 50 : 50} 
                    onChange={handleSizeChange}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rotación</label>
                  <input 
                    type="range" 
                    min="-180" 
                    max="180" 
                    value={state.imagePosition.angle || 0} 
                    onChange={handleRotationChange}
                    className="w-full"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Arrastra para posicionar la imagen en la plantilla</p>
            </div>
          </div>

          <div className="col-span-1">
            <h3 className="text-md font-medium mb-3">Seleccionar Plantilla</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-3 mb-6">
              {templates.map((template) => (
                <div 
                  key={template.id}
                  className={`border-2 ${state.selectedTemplate?.id === template.id ? 'border-primary' : 'border-gray-200'} rounded-lg p-1 cursor-pointer transition-all hover:border-primary/50`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="w-full aspect-[9/16] bg-gray-100 rounded flex items-center justify-center">
                    <img 
                      src={template.path} 
                      alt={template.name} 
                      className="w-full h-full object-cover rounded" 
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/1080x1920?text=Template';
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-md font-medium mb-3">Fondo de Plantilla</h3>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {['#0F2D52', '#FF0000', '#FFFFFF', '#003366', '#990000', '#CCCCCC', '#000000', '#333333'].map((color) => (
                <div 
                  key={color}
                  className={`w-8 h-8 rounded-full cursor-pointer border-2 ${selectedBackground === color ? 'ring-2 ring-primary ring-offset-2' : ''} ${color === '#FFFFFF' ? 'border-gray-300' : 'border-white'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleBackgroundColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t px-6 py-4 flex justify-between">
        <Button 
          variant="outline"
          onClick={handleGoBack}
        >
          Atrás
        </Button>
        <Button 
          onClick={handleProceed}
        >
          Siguiente: Agregar Precio
        </Button>
      </div>
    </div>
  );
};

export default CanvasEditor;
