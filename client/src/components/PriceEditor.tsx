
import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFabricCanvas, loadImageOntoCanvas, addTextToCanvas } from '@/lib/fabricSetup';
import { CANVAS_DIMENSIONS } from '@/config';
import * as fabric from 'fabric';

const PriceEditor: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_DIMENSIONS.width);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_DIMENSIONS.height);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceTextObj, setPriceTextObj] = useState<fabric.IText | null>(null);
  const [price, setPrice] = useState(state.priceText.replace('$', ''));

  // Initialize canvas when component mounts
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      console.log('Initializing Fabric.js canvas in PriceEditor');
      const canvas = createFabricCanvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight
      });
      
      fabricCanvasRef.current = canvas;
      dispatch({ type: 'SET_FABRIC_CANVAS', payload: canvas });
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
  }, [dispatch, canvasWidth, canvasHeight]);

  // Render the template, product image, and price text when anything changes
  useEffect(() => {
    if (fabricCanvasRef.current && state.selectedTemplate && state.processedImageUrl) {
      console.log('Updating canvas with template, image, and price text');
      const canvas = fabricCanvasRef.current;
      canvas.clear();

      // Add template background first
      loadImageOntoCanvas(canvas, state.selectedTemplate.path, {
        selectable: false,
        x: 0.5,
        y: 0.5
      }).then(() => {
        // Add product image
        loadImageOntoCanvas(canvas, state.processedImageUrl!, {
          x: state.imagePosition.x,
          y: state.imagePosition.y,
          angle: state.imagePosition.angle || 0,
          scale: state.imagePosition.scale || 1,
          selectable: false
        }).then(() => {
          // Add price text last
          const textObj = addTextToCanvas(canvas, state.priceText, {
            x: state.pricePosition.x,
            y: state.pricePosition.y,
            fontSize: state.priceStyle.fontSize,
            fontFamily: state.priceStyle.fontFamily,
            fontWeight: state.priceStyle.fontWeight,
            color: state.priceStyle.color,
            selectable: true
          });
          
          setPriceTextObj(textObj);
          
          // Listen for object modifications to update state
          textObj.on('modified', function() {
            if (canvas.width && canvas.height) {
              dispatch({
                type: 'SET_PRICE_POSITION',
                payload: {
                  x: textObj.left! / canvas.width,
                  y: textObj.top! / canvas.height
                }
              });
            }
          });
        });
      });
    }
  }, [
    state.selectedTemplate, 
    state.processedImageUrl, 
    state.priceText, 
    state.priceStyle, 
    state.pricePosition, 
    state.imagePosition, 
    dispatch
  ]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = e.target.value;
    setPrice(newPrice);
    const formattedPrice = `$${newPrice}`;
    
    dispatch({ type: 'SET_PRICE_TEXT', payload: formattedPrice });
    
    if (priceTextObj && fabricCanvasRef.current) {
      priceTextObj.set({ text: formattedPrice });
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fontSize = parseInt(e.target.value);
    
    dispatch({ 
      type: 'SET_PRICE_STYLE', 
      payload: { fontSize } 
    });
    
    if (priceTextObj && fabricCanvasRef.current) {
      priceTextObj.set({ fontSize });
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleColorChange = (color: string) => {
    dispatch({ 
      type: 'SET_PRICE_STYLE', 
      payload: { color } 
    });
    
    if (priceTextObj && fabricCanvasRef.current) {
      priceTextObj.set({ fill: color });
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleGoBack = () => {
    dispatch({ type: 'SET_STEP', payload: 2 });
  };

  const handleProceed = () => {
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  return (
    <div>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Personalizar Precio</h2>
        
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
          </div>

          <div className="col-span-1">
            <div className="bg-white border rounded-lg p-4 mb-4">
              <h3 className="text-md font-medium mb-3">Texto del Precio</h3>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Precio</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                    $
                  </span>
                  <Input 
                    type="text" 
                    value={price} 
                    onChange={handlePriceChange}
                    className="flex-1 rounded-none rounded-r-md"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Tamaño de Fuente: {state.priceStyle.fontSize}px</label>
                <input 
                  type="range" 
                  min="12" 
                  max="64" 
                  value={state.priceStyle.fontSize} 
                  onChange={handleFontSizeChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Pequeño</span>
                  <span>Grande</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Color del Texto</label>
                <div className="grid grid-cols-5 gap-2">
                  {['#0F2D52', '#FF0000', '#FFFFFF', '#000000', '#CCCCCC'].map(color => (
                    <div 
                      key={color} 
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                        state.priceStyle.color === color ? 'ring-2 ring-primary ring-offset-2' : ''
                      } ${color === '#FFFFFF' ? 'border-gray-300' : 'border-white'}`}
                      style={{ backgroundColor: color }} 
                      onClick={() => handleColorChange(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-2">Arrastra el texto del precio para posicionarlo</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800">El tamaño de fuente y posicionamiento se ajustarán automáticamente para verse bien en el estado de WhatsApp.</p>
                </div>
              </div>
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
          Siguiente: Vista Previa y Compartir
        </Button>
      </div>
    </div>
  );
};

export default PriceEditor;
