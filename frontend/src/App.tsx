import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { PATH_DATABASE, PATH_IMPORT, PATH_LOGIN, PATH_SETUP } from "@/config/K";
import { useAuth } from "@/context/Auth/Auth";
import { useLabels } from "@/context/Label/Label";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import MissingPage from "@/components/MissingPage/MissingPage";
import NavBar from "@/components/NavBar/NavBar";
import LoginPage from "@/features/Login/LoginPage";
import DatabaseMainPage from "@/features/MainScreen/DatabaseMainPage";
import SetupMainPage from "@/features/MainScreen/SetupMainPage";
import MassiveImport from "@/features/MassiveImport/MassiveImport";
import SetupNewObject from "@/features/Setup/SetupFeatures/SetupNewObject";
import SetupSections from "@/features/Setup/SetupFeatures/SetupSections/SetupSections";
import RecordDetail from "@/features/TableRecordDetails/RecordDetail";
import RecordsListView from "@/features/TableRecords/RecordsListView";

import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

function PublicRoute(): React.ReactElement {
  const { user } = useAuth();

  return user ? <Navigate to={PATH_DATABASE} replace /> : <Outlet />;
}

function ProtectedRoute(): React.ReactElement {
  const { user } = useAuth();
  const location = useLocation();

  return user ? (
    <>
      <NavBar />
      <ErrorBoundary resetKey={location.pathname}>
        <Outlet />
      </ErrorBoundary>
    </>
  ) : (
    <Navigate to={PATH_LOGIN} replace />
  );
}

function App() {
  const { getLabel, loading: loadingLabels } = useLabels();
  const { loading: loadingAuth } = useAuth();

  if (loadingAuth || loadingLabels)
    return (
      <div className="min-vh-100 d-flex flex-column">
        <LoadingScreen compact={true} />
      </div>
    );

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path={PATH_LOGIN} element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        {/* Automatic redirect from "/" to "/Database" */}
        <Route path="/" element={<Navigate to={PATH_DATABASE} replace />} />

        {/* 
            When the path is: 
              /Database is rendered the index
              /Database/XXXX is rendered the second path
        */}
        <Route path={PATH_DATABASE} element={<DatabaseMainPage />}>
          <Route index element={getLabel("DATABASE.SELECT_TABLE_MESSAGE")} />
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
        <Route path="*" element={<MissingPage />} />
      </Route>
    </Routes>
  );
}

export default App;
