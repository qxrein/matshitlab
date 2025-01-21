import React from 'react';
import MatlabNotebook from './components/MatlabNotebook';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-xl font-mono">MATSH*TLAB</h1>
      </header>
      <main>
        <MatlabNotebook />
      </main>
    </div>
  );
};

export default App;
