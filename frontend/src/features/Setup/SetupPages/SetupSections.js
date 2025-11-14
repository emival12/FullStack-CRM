import { useOutletContext, useParams } from "react-router-dom";

import SetupSectionHome from "./SetupSectionHome";
import { Sections } from "../K_Setup";

export default function SetupSectionObject() {
  const { tableKey, sectionKey } = useParams();
  const {
    selectedTableKey,
    selectedSectionKey,
    setSelectedTableKey,
    setSelectedSection,
    refreshSidebar,
    setRefreshSidebar,
  } = useOutletContext();

  const actualTableKey = selectedTableKey || tableKey;
  const actualSectionKey = selectedSectionKey || sectionKey;

  const pickScreen = () => {
    if (actualSectionKey === Sections.home) {
      return (
        <SetupSectionHome
          selectedTableKey={actualTableKey}
          selectedSectionKey={actualSectionKey}
          setSelectedTableKey={setSelectedTableKey}
        />
      );
    } else {
      return <p>Altro</p>;
    }
  };

  return pickScreen();
}
