import React, { createContext, useContext, useState } from 'react';

const StepStatusContext = createContext();

export const StepStatusProvider = ({ children }) => {
  const [stepStatuses, setStepStatuses] = useState({});

  return (
    <StepStatusContext.Provider value={{ stepStatuses, setStepStatuses }}>
      {children}
    </StepStatusContext.Provider>
  );
};

export const useStepStatus = () => {
  const context = useContext(StepStatusContext);
  if (!context) {
    throw new Error('useStepStatus must be used within a StepStatusProvider');
  }
  return context;
}; 