import { useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";

import SetupSectionHome from "./SetupSectionHome";
import { Sections } from "../K_Setup";
import SetupSectionFields from "./SetupSectionFields";

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
    selectedRecord?.record?.[selectedRecord?.primary_key] || recordId;

  useEffect(() => {
    if (
      !recordId ||
      recordId != selectedRecord?.record?.[selectedRecord?.primary_key]
    ) {
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
    } else if (actualSectionKey === Sections.fields && !selectedRecord) {
      return (
        <SetupSectionFields
          selectedTableKey={actualTableKey}
          setSelectedTableKey={setSelectedTableKey}
          selectedSectionKey={actualSectionKey}
          setSelectedRecord={setSelectedRecord}
        />
      );
    } else if (actualSectionKey === Sections.fields && selectedRecord) {
      return <p>Here</p>;
    } else {
      return <p>Altro</p>;
    }
  };

  return pickScreen();
}
