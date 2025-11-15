import { useOutletContext, useParams } from "react-router-dom";

import SetupSectionHome from "./SetupSectionHome";
import { Sections } from "../K_Setup";
import SetupSectionFields from "./SetupSectionFields";

export default function SetupSectionObject() {
  const { tableKey, sectionKey } = useParams();
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

  const pickScreen = () => {
    if (actualSectionKey === Sections.home) {
      return (
        <SetupSectionHome
          selectedTableKey={actualTableKey}
          setSelectedTableKey={setSelectedTableKey}
          selectedSectionKey={actualSectionKey}
        />
      );
    } else if (actualSectionKey === Sections.fields) {
      return (
        <SetupSectionFields
          selectedTableKey={actualTableKey}
          setSelectedTableKey={setSelectedTableKey}
          selectedSectionKey={actualSectionKey}
          setSelectedRecord={setSelectedRecord}
        />
      );
    } else {
      return <p>Altro</p>;
    }
  };

  return pickScreen();
}
