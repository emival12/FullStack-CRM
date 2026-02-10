import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Button } from "react-bootstrap";

import { API_BASE_URL, PATH_SETUP } from "../../../../config/K";
import { useLabels } from "../../../../config/Label";
import LoadingScreen from "../../../../components/LoadingScreen";
import NewFieldRecord from "./NewFieldRecord";
import DynamicRecordsList from "../../../../components/dynamicUI/DynamicRecordsList";

/**
 * Page used for the section Fields of an object in the setup
 *
 * @param {String} props.tableKey       - Table currently selected
 * @param {String} props.sectionKey     - Section currently selected
 */
export default function SetupSectionFields({ tableKey, sectionKey }) {
  const { getLabel } = useLabels();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchData = useCallback(() => {
    if (!tableKey || !sectionKey) return; // Blocks execution if the selected table is not correct

    setLoading(true);
    axios
      .get(`${API_BASE_URL}${PATH_SETUP}/${tableKey}/${sectionKey}`)
      .then((res) => {
        console.log(
          "SetupSectionFields - List of Fields Object received:",
          res.data,
        );
        setRecords(res.data);
      })
      .catch((err) => console.error("SetupSectionFields - Error:", err))
      .finally(() => setLoading(false));
  }, [tableKey, sectionKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          {getLabel("BUTTONS.NEW_LABEL")}
        </Button>
      </div>
      <DynamicRecordsList
        data={records}
        redirectKey={`${tableKey}/${sectionKey}`}
        pathRedirect={PATH_SETUP}
      />
      <NewFieldRecord
        tableKey={tableKey}
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        refreshData={fetchData}
      />
    </>
  );
}
