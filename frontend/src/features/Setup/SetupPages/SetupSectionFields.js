import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

import { NEW_LABEL } from "../../../config/IT";
import { API_BASE_URL, PATH_SETUP } from "../../../config/K";
import { NEW_FIELD_OBJECT_STRUCTURE } from "../K_Setup";
import LoadingScreen from "../../../components/LoadingScreen";
import RecordsList from "../../TableRecords/RecordsList";
import NewFieldRecord from "./NewFieldRecord";

/**
 * Page used for the section Fields of an object in the setup
 *
 * @param {Object} props.selectedTableKey       - Table currently selected
 * @param {Function} props.setSelectedTableKey  - Function to update the selected Table
 * @param {Object} props.selectedSectionKey     - Section currently selected
 * @param {Function} props.setSelectedRecord    - Function to update the selected Record
 */
export default function SetupSectionFields({
  selectedTableKey,
  setSelectedTableKey,
  selectedSectionKey,
  setSelectedRecord,
}) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchData = () => {
    if (!selectedTableKey && !selectedSectionKey) return; // Blocks execution if the selected tabel is not correct
    setSelectedRecord(null);

    setLoading(true);
    axios
      .get(
        API_BASE_URL +
          PATH_SETUP +
          "/" +
          selectedTableKey +
          "/" +
          selectedSectionKey
      )
      .then((res) => {
        console.log("Setup Records Fields Object list received:", res.data);
        setRecords(res.data);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <div className="d-flex flex-row-reverse pb-2 pt-2">
        <Button
          size="sm"
          onClick={() => {
            setShowNewModal(true);
          }}
        >
          {NEW_LABEL}
        </Button>
      </div>
      <RecordsList
        records={records}
        selectedTableKey={selectedTableKey + "/" + selectedSectionKey}
        onSelectedTable={setSelectedTableKey}
        onSelectedRecord={setSelectedRecord}
        pathRedirect={PATH_SETUP}
      />
      <NewFieldRecord
        selectedTableKey={selectedTableKey}
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        refreshData={fetchData}
      />
    </>
  );
}
