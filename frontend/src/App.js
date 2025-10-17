import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";

import "./App.css";
import MainScreen from "./features/MainScreen/MainScreen";
import TableRecordsView from "./features/TableRecords/TableRecordsView";
import { PATH_DATABASE } from "./config/K";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        {/* Automatic redirect from "/" to "/Database" */}
        <Route path="/" element={<Navigate to={PATH_DATABASE} replace />} />

        {/* 
            When the path is: 
              /Database is rendered the index
              /Database/XXXX is rendered the second path
          */}

        <Route path={PATH_DATABASE} element={<MainScreen />}>
          {/*TODO Improv */}
          <Route index element={<p>Seleziona una tabella dalla sidebar</p>} />
          <Route path=":tableName" element={<TableRecordsView />} />
        </Route>
        <Route path="/TOBE" element={<div>Pagina TOBE</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
