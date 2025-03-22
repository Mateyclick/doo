import React from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Step } from "@/contexts/AppContext";

const steps = [
  { id: 1, name: "Upload & Remove" },
  { id: 2, name: "Template" },
  { id: 3, name: "Price" },
  { id: 4, name: "Share" },
];

const ProgressSteps: React.FC = () => {
  const { state } = useAppContext();
  const { currentStep } = state;

  const getStepProgress = (stepId: number): number => {
    if (stepId < currentStep) return 100;
    if (stepId === currentStep) return 50;
    return 0;
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center w-full max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${step.id <= currentStep ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'}`}
              >
                {step.id}
              </div>
              <div className="text-xs font-medium mt-2 text-center">{step.name}</div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="h-1 bg-gray-200 flex-grow mx-2">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${getStepProgress(step.id)}%` }}
                ></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressSteps;
