import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import SelectionSidebar from "./features/TableSelection/SelectionSidebar";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<div>Pagina Database</div>} />
        <Route path="/Database" element={<SelectionSidebar />} />
        <Route path="/TOBE" element={<div>Pagina TOBE</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
