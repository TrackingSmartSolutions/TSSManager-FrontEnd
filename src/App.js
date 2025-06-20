import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login/Login';
import Principal from './components/Principal/Principal';
import Empresas from './components/Empresas/Empresas';
import Mapa from './components/Mapa/Mapa';
import Tratos from './components/Tratos/Tratos';
import DetallesTrato from './components/Tratos/DetallesTrato'
import EquiposEstatusPlataforma from './components/Equipos/Equipos_EstatusPlataforma'
import EquiposModelos from './components/Equipos/Equipos_Modelos';
import EquiposProveedores from './components/Equipos/Equipos_Proveedores';
import EquiposInventario from './components/Equipos/Equipos_Inventario';
import EquiposSim from './components/Equipos/Equipos_Sim';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/principal" element={<Principal />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/tratos" element={<Tratos />} />
        <Route path="/detallestrato/:id" element={<DetallesTrato />} />
        <Route path="/equipos_estatusplataforma" element={<EquiposEstatusPlataforma />} />
        <Route path="/equipos_modelos" element={<EquiposModelos />} />
        <Route path="/equipos_proveedores" element={<EquiposProveedores />} />
        <Route path="/equipos_inventario" element={<EquiposInventario />} />
           <Route path="/equipos_sim" element={<EquiposSim />} />
      </Routes>
    </Router>
  );
}

export default App;