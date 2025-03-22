
import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { createFabricCanvas, loadImageOntoCanvas, addTextToCanvas, exportCanvasToImage } from '@/lib/fabricSetup';
import { CANVAS_DIMENSIONS } from '@/config';
import * as fabric from 'fabric';
import { useToast } from '@/hooks/use-toast';

const PreviewShare: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_DIMENSIONS.width);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_DIMENSIONS.height);
  const [usageCount, setUsageCount] = useState(parseInt(localStorage.getItem("germancitoUsage") || "0"));
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize canvas when component mounts
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      console.log('Initializing Fabric.js canvas in PreviewShare');
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
      console.log('Generating final preview');
      const canvas = fabricCanvasRef.current;
      canvas.clear();
      setIsGenerating(true);

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
          addTextToCanvas(canvas, state.priceText, {
            x: state.pricePosition.x,
            y: state.pricePosition.y,
            fontSize: state.priceStyle.fontSize,
            fontFamily: state.priceStyle.fontFamily,
            fontWeight: state.priceStyle.fontWeight,
            color: state.priceStyle.color,
            selectable: false
          });

          // Generate final image
          exportCanvasToImage(canvas).then(blob => {
            const dataUrl = URL.createObjectURL(blob);
            setFinalImageUrl(dataUrl);
            setIsGenerating(false);
          }).catch(error => {
            console.error('Error generating final image:', error);
            setIsGenerating(false);
            toast({
              title: "Error",
              description: "No se pudo generar la imagen final",
              variant: "destructive"
            });
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
    dispatch,
    toast
  ]);

  const handleDownload = () => {
    if (!finalImageUrl) {
      toast({
        title: "Error",
        description: "No hay imagen para descargar",
        variant: "destructive"
      });
      return;
    }
    
    // Update usage count in localStorage
    const newCount = usageCount + 1;
    localStorage.setItem("germancitoUsage", newCount.toString());
    setUsageCount(newCount);
    
    // Create and trigger download link
    const link = document.createElement('a');
    link.href = finalImageUrl;
    link.download = 'oferta-final.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "¡Listo!",
      description: "Imagen descargada correctamente",
    });
  };

  const handleStartOver = () => {
    dispatch({ type: 'RESET_STATE' });
    dispatch({ type: 'SET_STEP', payload: 1 });
  };

  const handleGoBack = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  return (
    <div>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Vista Previa y Compartir</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2">
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <div 
                ref={canvasContainerRef} 
                className="relative bg-white overflow-hidden rounded-lg shadow-sm aspect-[9/16]"
              >
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm">Generando imagen final...</p>
                    </div>
                  </div>
                )}
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full"
                ></canvas>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                className="bg-[#0F2D52] hover:bg-[#0a1f38] text-white py-3 px-8 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                onClick={handleDownload}
                disabled={isGenerating || !finalImageUrl}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Descargar para Instagram</span>
              </Button>
            </div>
          </div>

          <div className="col-span-1">
            <div className="bg-white border rounded-lg p-4 mb-4">
              <h3 className="text-md font-medium mb-3">Compartir en WhatsApp</h3>
              <div className="bg-[#25D366]/10 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-800">Compartir como Estado de WhatsApp</h4>
                    <ol className="mt-2 text-sm text-gray-600 list-decimal pl-4 space-y-1">
                      <li>Descarga la imagen</li>
                      <li>Abre la aplicación de WhatsApp</li>
                      <li>Ve a la pestaña de Estado</li>
                      <li>Selecciona la imagen descargada</li>
                      <li>Añade una descripción (opcional)</li>
                      <li>Toca "Enviar"</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-2">Historia de Instagram</h4>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium text-white">Compartir como Historia de Instagram</h4>
                      <ol className="mt-2 text-sm text-white list-decimal pl-4 space-y-1">
                        <li>Descarga la imagen</li>
                        <li>Abre la aplicación de Instagram</li>
                        <li>Toca tu foto de perfil con "+"</li>
                        <li>Selecciona la imagen descargada</li>
                        <li>Añade stickers o texto (opcional)</li>
                        <li>Toca "Tu Historia"</li>
                      </ol>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-1 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                    <span className="text-sm">Facebook</span>
                  </button>
                  <button className="flex-1 bg-[#0F2D52] hover:bg-[#0a1f38] text-white py-2 rounded flex items-center justify-center gap-1 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.599-.1-.899a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z"></path>
                    </svg>
                    <span className="text-sm">Twitter</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium mb-2">Crear Otra Oferta</h3>
              <p className="text-sm text-gray-600 mb-3">¿Quieres crear una imagen de oferta diferente?</p>
              <Button 
                variant="outline"
                className="w-full border border-primary text-primary hover:bg-primary/5"
                onClick={handleStartOver}
              >
                Comenzar de Nuevo
              </Button>
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
      </div>
    </div>
  );
};

export default PreviewShare;
