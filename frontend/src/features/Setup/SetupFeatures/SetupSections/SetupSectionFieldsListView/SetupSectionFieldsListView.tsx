import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Button } from "react-bootstrap";
import { RecordListStructure } from "commot.types";
import { SetupSectionBaseProps } from "features/Setup/SetupFeatures/SetupSections/SetupSections.types";

import { API_BASE_URL, PATH_SETUP } from "config/K";
import { useLabels } from "context/Label/Label";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import DynamicRecordsList from "components/dynamicUI/DynamicRecordsList/DynamicRecordsList";
import NewFieldRecord from "./NewFieldRecord";

/**
 * Page used for the section Fields of an object in the setup
 */
export default function SetupSectionFieldsListView({
  tableKey,
  sectionKey,
}: SetupSectionBaseProps) {
  const { getLabel } = useLabels();

  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [records, setRecords] = useState<RecordListStructure>({
    fields: [],
    primary_key_name: "",
    records: [],
  });

  const fetchData = useCallback(() => {
    if (!tableKey || !sectionKey) return; // Blocks execution if the selected table is not correct

    setLoading(true);
    axios
      .get<RecordListStructure>(
        `${API_BASE_URL}${PATH_SETUP}/${tableKey}/${sectionKey}`,
      )
      .then((res) => {
        console.log(
          "SetupSectionFieldsListView - List of Fields Object received:",
          res.data,
        );
        setRecords(res.data);
      })
      .catch((err) => console.error("SetupSectionFieldsListView - Error:", err))
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
