import "bootstrap-icons/font/bootstrap-icons.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";

import "./App.css";
import { PATH_DATABASE, PATH_IMPORT, PATH_SETUP } from "./config/K";
import { DB_INTRO_LABEL } from "./config/IT";
import DatabaseMainPage from "./features/MainScreen/DatabaseMainPage";
import RecordsListView from "./features/TableRecords/RecordsListView";
import RecordDetail from "./features/TableRecordDetails/RecordDetail";
import SetupMainPage from "./features/MainScreen/SetupMainPage";
import SetupNewObject from "./features/Setup/SetupPages/SetupNewObject";
import SetupSections from "./features/Setup/SetupPages/SetupSections";
import MassiveImport from "./features/MassiveImport/MassiveImport";

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
          <Route index element={DB_INTRO_LABEL} />
          <Route path=":tableKey" element={<RecordsListView />} />
          <Route path=":tableKey/:recordId" element={<RecordDetail />} />
        </Route>
        <Route path={PATH_IMPORT} element={<MassiveImport />} />
        <Route path={PATH_SETUP} element={<SetupMainPage />}>
          <Route index element={<SetupNewObject />} />
          <Route path=":tableKey" element={<Navigate to="home" replace />} />
          <Route path=":tableKey/:sectionKey" element={<SetupSections />} />
          <Route
            path=":tableKey/:sectionKey/:recordId"
            element={<SetupSections />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
