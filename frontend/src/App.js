import "bootstrap-icons/font/bootstrap-icons.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";

import "./App.css";
import { PATH_DATABASE, PATH_SETUP } from "./config/K";
import DatabaseMainPage from "./features/MainScreen/DatabaseMainPage";
import RecordsListView from "./features/TableRecords/RecordsListView";
import RecordDetail from "./features/TableRecordDetails/RecordDetail";
import SetupMainPage from "./features/MainScreen/SetupMainPage";
import SetupNewObject from "./features/SetupPages/SetupNewObject";

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

        <Route path={PATH_DATABASE} element={<DatabaseMainPage />}>
          {/*TODO Improv */}
          <Route index element={<p>Seleziona una tabella dalla sidebar</p>} />
          <Route path=":tableKey" element={<RecordsListView />} />
          <Route path=":tableKey/:recordId" element={<RecordDetail />} />
        </Route>
        <Route path="/TOBE" element={<div>Pagina TOBE</div>} />
        <Route path={PATH_SETUP} element={<SetupMainPage />}>
          {/*TODO Improv */}
          <Route index element={<SetupNewObject />} />
          <Route path=":tableKey" element={<p>body </p>} />
          <Route path=":tableKey/:sectionKey" element={<p>body Section</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
