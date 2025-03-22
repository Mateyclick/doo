
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
      <Link href="/">
        <Button>Volver al Inicio</Button>
      </Link>
    </div>
  );
};

export default NotFound;
