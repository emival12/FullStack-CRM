import { useOutletContext } from "react-router-dom";

import { Sections } from "../K_Setup";
import SetupSectionHome from "./Sections/SetupSectionHome";
import SetupSectionFieldsListView from "./Sections/SetupSectionFieldsListView";
import SetupSectionFieldsEdit from "./Sections/SetupSectionFieldsEdit";

export default function SetupSectionObject() {
  const { tableKey, sectionKey, recordId } = useOutletContext();

  const pickScreen = () => {
    const screens = {
      [Sections.home]: (
        <SetupSectionHome tableKey={tableKey} sectionKey={sectionKey} />
      ),
      [Sections.layout]: <p>Layout TODO</p>,
      [Sections.record_types]: <p>Record Types TODO</p>,
      [Sections.related_lists]: <p>Related Lists TODO</p>,
    };

    if (sectionKey === Sections.fields) {
      if (!recordId) {
        return (
          <SetupSectionFieldsListView
            tableKey={tableKey}
            sectionKey={sectionKey}
            recordId={recordId}
          />
        );
      } else {
        return (
          <SetupSectionFieldsEdit
            tableKey={tableKey}
            sectionKey={sectionKey}
            recordId={recordId}
          />
        );
      }
    }

    return screens[sectionKey] || <p>Sezione non trovata</p>;
  };

  return pickScreen();
}
