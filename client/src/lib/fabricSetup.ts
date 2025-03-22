
import * as fabric from 'fabric';

export interface FabricCanvasOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export const createFabricCanvas = (
  canvasElement: HTMLCanvasElement,
  options: FabricCanvasOptions = {}
): fabric.Canvas => {
  // Create a new Fabric.js canvas
  const canvas = new fabric.Canvas(canvasElement, {
    width: options.width || 1080,
    height: options.height || 1920,
    backgroundColor: options.backgroundColor || '#FFFFFF',
    preserveObjectStacking: true,
    selection: false,
  });

  return canvas;
};

export const loadImageOntoCanvas = (
  canvas: fabric.Canvas,
  imageUrl: string,
  options: {
    scale?: number;
    x?: number;
    y?: number;
    angle?: number;
    selectable?: boolean;
  } = {}
): Promise<fabric.Image> => {
  return new Promise((resolve, reject) => {
    // Fix the fabric.Image.fromURL usage to match Fabric.js API
    fabric.Image.fromURL(
      imageUrl,
      (fabricImage: fabric.Image) => {
        const canvasWidth = canvas.width || 1080;
        const canvasHeight = canvas.height || 1920;
        
        // Default position to center if not specified
        const x = options.x !== undefined ? canvasWidth * options.x : canvasWidth / 2;
        const y = options.y !== undefined ? canvasHeight * options.y : canvasHeight / 2;
        
        // Set image properties
        fabricImage.set({
          originX: 'center',
          originY: 'center',
          left: x,
          top: y,
          angle: options.angle || 0,
          selectable: options.selectable !== undefined ? options.selectable : true,
        });
        
        // Scale image if needed
        if (options.scale) {
          fabricImage.scale(options.scale);
        } else {
          // Default scale to fit within canvas (70% width max)
          const maxWidth = canvasWidth * 0.7;
          const imgScaleX = maxWidth / (fabricImage.width || 1);
          fabricImage.scale(imgScaleX);
        }
        
        canvas.add(fabricImage);
        canvas.renderAll();
        resolve(fabricImage);
      },
      { crossOrigin: 'anonymous' }
    );
  });
};

export const addTextToCanvas = (
  canvas: fabric.Canvas,
  text: string,
  options: {
    x?: number;
    y?: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    color?: string;
    selectable?: boolean;
  } = {}
): fabric.IText => {
  const canvasWidth = canvas.width || 1080;
  const canvasHeight = canvas.height || 1920;
  
  // Default position to bottom center if not specified
  const x = options.x !== undefined ? canvasWidth * options.x : canvasWidth / 2;
  const y = options.y !== undefined ? canvasHeight * options.y : canvasHeight * 0.8;
  
  const textObj = new fabric.IText(text, {
    fontFamily: options.fontFamily || 'Arial',
    fontSize: options.fontSize || 32,
    fontWeight: options.fontWeight || 'bold',
    fill: options.color || '#000000',
    originX: 'center',
    originY: 'center',
    left: x,
    top: y,
    selectable: options.selectable !== undefined ? options.selectable : true,
    cornerColor: 'rgba(79, 70, 229, 0.8)',
    cornerStrokeColor: 'rgba(79, 70, 229, 1)',
    cornerSize: 10,
    transparentCorners: false,
    borderColor: 'rgba(79, 70, 229, 0.8)',
    borderScaleFactor: 1.5,
  });
  
  canvas.add(textObj);
  canvas.renderAll();
  
  return textObj;
};

export const exportCanvasToImage = (canvas: fabric.Canvas): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error('Canvas is not initialized'));
      return;
    }
    
    try {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      
      // Convert data URL to Blob
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => resolve(blob))
        .catch(error => reject(error));
    } catch (error) {
      reject(error);
    }
  });
};
