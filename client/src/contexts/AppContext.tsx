
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as fabric from 'fabric';
import { TemplateType } from '@/types';

export type Step = 1 | 2 | 3 | 4;

interface PriceStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  color: string;
}

interface Position {
  x: number;
  y: number;
  angle?: number;
  scale?: number;
}

export interface AppState {
  currentStep: Step;
  uploadedImage: File | null;
  originalImageUrl: string | null;
  processedImageUrl: string | null;
  fabricCanvas: fabric.Canvas | null;
  selectedTemplate: TemplateType | null;
  priceText: string;
  priceStyle: PriceStyle;
  pricePosition: Position;
  imagePosition: Position;
  loading: boolean;
  error: string | null;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

type ActionTypes =
  | { type: 'SET_STEP'; payload: Step }
  | { type: 'SET_UPLOADED_IMAGE'; payload: File }
  | { type: 'SET_ORIGINAL_IMAGE'; payload: string }
  | { type: 'SET_PROCESSED_IMAGE'; payload: string }
  | { type: 'SET_FABRIC_CANVAS'; payload: fabric.Canvas }
  | { type: 'SET_TEMPLATE'; payload: TemplateType }
  | { type: 'SET_PRICE_TEXT'; payload: string }
  | { type: 'SET_PRICE_STYLE'; payload: Partial<PriceStyle> }
  | { type: 'SET_PRICE_POSITION'; payload: Partial<Position> }
  | { type: 'SET_IMAGE_POSITION'; payload: Partial<Position> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  currentStep: 1,
  uploadedImage: null,
  originalImageUrl: null,
  processedImageUrl: null,
  fabricCanvas: null,
  selectedTemplate: null,
  priceText: '$99.99',
  priceStyle: {
    fontFamily: 'Arial',
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF0000'
  },
  pricePosition: {
    x: 0.5, // center of canvas
    y: 0.8  // 80% down from top
  },
  imagePosition: {
    x: 0.5, // center of canvas
    y: 0.4, // 40% down from top
    angle: 0,
    scale: 1
  },
  loading: false,
  error: null
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const appReducer = (state: AppState, action: ActionTypes): AppState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_UPLOADED_IMAGE':
      return { ...state, uploadedImage: action.payload };
    case 'SET_ORIGINAL_IMAGE':
      return { ...state, originalImageUrl: action.payload };
    case 'SET_PROCESSED_IMAGE':
      return { ...state, processedImageUrl: action.payload };
    case 'SET_FABRIC_CANVAS':
      return { ...state, fabricCanvas: action.payload };
    case 'SET_TEMPLATE':
      return { ...state, selectedTemplate: action.payload };
    case 'SET_PRICE_TEXT':
      return { ...state, priceText: action.payload };
    case 'SET_PRICE_STYLE':
      return { 
        ...state, 
        priceStyle: { ...state.priceStyle, ...action.payload } 
      };
    case 'SET_PRICE_POSITION':
      return { 
        ...state, 
        pricePosition: { ...state.pricePosition, ...action.payload } 
      };
    case 'SET_IMAGE_POSITION':
      return { 
        ...state, 
        imagePosition: { ...state.imagePosition, ...action.payload } 
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_STATE':
      return {
        ...initialState,
        // Preserve these properties when resetting
        fabricCanvas: state.fabricCanvas
      };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Clean up image URLs
      if (state.originalImageUrl) {
        URL.revokeObjectURL(state.originalImageUrl);
      }
      
      // Dispose of fabric canvas
      if (state.fabricCanvas) {
        try {
          state.fabricCanvas.dispose();
        } catch (error) {
          console.error('Error disposing canvas:', error);
        }
      }
    };
  }, []);

  const value = { state, dispatch };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};
