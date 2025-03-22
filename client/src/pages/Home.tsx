
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import ProgressSteps from '@/components/ProgressSteps';
import ImageUploader from '@/components/ImageUploader';
import CanvasEditor from '@/components/CanvasEditor';
import PriceEditor from '@/components/PriceEditor';
import PreviewShare from '@/components/PreviewShare';
import LoadingOverlay from '@/components/LoadingOverlay';
import ErrorMessage from '@/components/ErrorMessage';
import { DEFAULT_TEMPLATES } from '@/config';
import { TemplateType } from '@/types';

const Home: React.FC = () => {
  const { state } = useAppContext();
  const [templates, setTemplates] = useState<TemplateType[]>([]);
  
  useEffect(() => {
    // In a real app, you might fetch templates from an API
    // For now, we'll use the default templates from config
    setTemplates(DEFAULT_TEMPLATES);
  }, []);

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <ImageUploader />;
      case 2:
        return <CanvasEditor templates={templates} />;
      case 3:
        return <PriceEditor />;
      case 4:
        return <PreviewShare />;
      default:
        return <ImageUploader />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl page-transition">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary scale-in">OfertaBuilder</h1>
        <p className="text-gray-600 max-w-2xl mx-auto slide-in-up">
          Create professional offer images for WhatsApp and Instagram in just a few steps
        </p>
      </div>
      
      <ProgressSteps />
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 fade-in">
        <div className="relative">
          {state.loading && <LoadingOverlay />}
          <ErrorMessage />
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default Home;
