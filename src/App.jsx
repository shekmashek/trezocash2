import React from 'react';
import { DataProvider } from './context/DataContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import AppContent from './AppContent.jsx';

function App() {
  return (
    <DataProvider>
      <UIProvider>
        <AppContent />
      </UIProvider>
    </DataProvider>
  );
}

export default App;
