import React, { useEffect } from 'react';
import Header from './components/Header.jsx';
import Homepage from './views/homepage.jsx';
import Form from './views/form.jsx';
import FixedPoolPage from './views/fixedpoolpage.jsx';
import LeveragePoolPage from './views/leveragepoolpage.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ContextProvider from './context/stateContext';

function App() {
  return (
    <ContextProvider>
      <Router>
        <Header />
        <Routes>
          <Route exact path="/form" element={<Form />} />
          <Route exact path="/fixed-pools" element={<FixedPoolPage />} />
          <Route exact path="/leverage-pools" element={<LeveragePoolPage />} />
          <Route path="*" element={<Homepage />} />
        </Routes>
      </Router>
    </ContextProvider>
  );
}

export default App;
