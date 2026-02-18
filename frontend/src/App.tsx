import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { PATH_DATABASE, PATH_IMPORT, PATH_LOGIN, PATH_SETUP } from "./config/K";
import { useAuth } from "./context/Auth/Auth";
import { useLabels } from "./context/Label/Label";
import DatabaseMainPage from "./features/MainScreen/DatabaseMainPage";
import RecordsListView from "./features/TableRecords/RecordsListView";
import RecordDetail from "./features/TableRecordDetails/RecordDetail";
import MassiveImport from "./features/MassiveImport/MassiveImport";
/*
import SetupMainPage from "./features/MainScreen/SetupMainPage";
import SetupNewObject from "./features/Setup/SetupPages/SetupNewObject";
import SetupSections from "./features/Setup/SetupPages/SetupSections";

*/
import MissingPage from "./components/MissingPage/MissingPage";
import LoginPage from "./features/Login/LoginPage";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import NavBar from "./components/NavBar/NavBar";

function App() {
  const { user, loading } = useAuth();
  const { getLabel } = useLabels();

  if (loading)
    return (
      <div className="min-vh-100 d-flex flex-column">
        <LoadingScreen />
      </div>
    );

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="*" element={<Navigate to={PATH_LOGIN} replace />} />
          <Route path={PATH_LOGIN} element={<LoginPage />} />
        </Routes>
      ) : (
        <>
          <NavBar />
          <Routes>
            {/* Automatic redirect from "/" or "/login" to "/Database" */}
            <Route path="/" element={<Navigate to={PATH_DATABASE} replace />} />
            <Route
              path={PATH_LOGIN}
              element={<Navigate to={PATH_DATABASE} replace />}
            />

            {/* 
            When the path is: 
              /Database is rendered the index
              /Database/XXXX is rendered the second path
            */}
            <Route path={PATH_DATABASE} element={<DatabaseMainPage />}>
              <Route index element={getLabel("GENERIC.DB_INTRO_LABEL")} />
              <Route path=":tableKey" element={<RecordsListView />} />
              <Route path=":tableKey/:recordId" element={<RecordDetail />} />
            </Route>
            <Route path={PATH_IMPORT} element={<MassiveImport />} />
            {/*
            <Route path={PATH_SETUP} element={<SetupMainPage />}>
              <Route index element={<SetupNewObject />} />
              <Route
                path=":tableKey"
                element={<Navigate to="home" replace />}
              />
              <Route path=":tableKey/:sectionKey" element={<SetupSections />} />
              <Route
                path=":tableKey/:sectionKey/:recordId"
                element={<SetupSections />}
              />
            </Route>
            */}
            <Route path="*" element={<MissingPage />} />
          </Routes>
        </>
      )}
    </BrowserRouter>
  );
}

export default App;
