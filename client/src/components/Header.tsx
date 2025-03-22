import React, { useEffect, useState } from 'react';

interface LogoConfig {
  logoPath: string;
}

const Header: React.FC = () => {
  const [logoPath, setLogoPath] = useState<string>('/logo.png');
  const [usageCount, setUsageCount] = useState<number>(0);
  
  useEffect(() => {
    // Load config from config.json
    fetch('/config.json')
      .then(response => response.json())
      .then(data => {
        if (data.logoPath) {
          setLogoPath(data.logoPath);
        }
      })
      .catch(error => {
        console.error('Error loading config:', error);
      });
    
    // Load usage count from localStorage
    const savedCount = localStorage.getItem('germancitoUsage');
    if (savedCount) {
      setUsageCount(parseInt(savedCount));
    }
  }, []);

  return (
    <header className="bg-[var(--primary)] text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={logoPath} 
            alt="App Logo" 
            className="h-8 mr-3"
            onError={(e) => { 
              // Fallback if image doesn't load
              e.currentTarget.style.display = 'none'; 
            }} 
          />
          <h1 className="text-xl font-bold">Germancito</h1>
        </div>
        <div className="text-sm">
          Total Edits: <span className="font-bold">{usageCount}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;