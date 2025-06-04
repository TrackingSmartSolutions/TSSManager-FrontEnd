import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login/Login'; 
import Principal from './components/Principal/Principal';
import Empresas from './components/Empresas/Empresas';
import Mapa from './components/Mapa/Mapa';
import Tratos from './components/Tratos/Tratos';
import DetallesTrato from './components/Tratos/DetallesTrato'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/principal" element={<Principal />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/tratos" element={<Tratos />} />
        <Route path="/detallestrato" element={<DetallesTrato />} />
        
      </Routes>
    </Router>
  );
}

export default App;