import { useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";

import SetupSectionHome from "./SetupSectionHome";
import { Sections } from "../K_Setup";
import SetupSectionFields from "./SetupSectionFields";
import EditFieldRecord from "./EditFieldRecord";

export default function SetupSectionObject() {
  const { tableKey, sectionKey, recordId } = useParams();
  const {
    selectedTableKey,
    selectedSectionKey,
    setSelectedTableKey,
    setSelectedSection,
    refreshSidebar,
    setRefreshSidebar,
    selectedRecord,
    setSelectedRecord,
  } = useOutletContext();

  const actualTableKey = selectedTableKey || tableKey;
  const actualSectionKey = selectedSectionKey || sectionKey;
  const actualRecordKey =
    selectedRecord?.record[selectedRecord?.primary_key] || recordId;

  useEffect(() => {
    if (!recordId && !actualRecordKey) {
      setSelectedRecord(null);
    }
  }, [recordId]);

  const pickScreen = () => {
    if (actualSectionKey === Sections.home) {
      return (
        <SetupSectionHome
          selectedTableKey={actualTableKey}
          setSelectedTableKey={setSelectedTableKey}
          selectedSectionKey={actualSectionKey}
        />
      );
    } else if (actualSectionKey === Sections.fields && !actualRecordKey) {
      return (
        <SetupSectionFields
          selectedTableKey={actualTableKey}
          setSelectedTableKey={setSelectedTableKey}
          selectedSectionKey={actualSectionKey}
          setSelectedRecord={setSelectedRecord}
        />
      );
    } else if (actualSectionKey === Sections.fields && actualRecordKey) {
      return (
        <EditFieldRecord
          selectedTableKey={actualTableKey}
          selectedSectionKey={actualSectionKey}
          selectedRecord={actualRecordKey}
          setSelectedRecord={setSelectedRecord}
        />
      );
    } else {
      return <p>Altro</p>;
    }
  };

  return pickScreen();
}
