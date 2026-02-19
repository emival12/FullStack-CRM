import { useOutletContext } from "react-router-dom";
import { SetupOutletContext, Sections } from "commot.types";

import SetupSectionHome from "./SetupSectionHome/SetupSectionHome";
import SetupSectionFieldsListView from "./SetupSectionFieldsListView/SetupSectionFieldsListView";
import SetupSectionFieldsEdit from "./SetupSectionFieldsEdit/SetupSectionFieldsEdit";

export default function SetupSectionObject(): React.ReactElement {
  const { tableKey, sectionKey, recordId } =
    useOutletContext<SetupOutletContext>();

  const pickScreen = () => {
    if (!tableKey || !sectionKey) return <></>;

    const screens = {
      [Sections.HOME]: (
        <SetupSectionHome tableKey={tableKey} sectionKey={sectionKey} />
      ),
      [Sections.LAYOUT]: <p>Layout TODO</p>,
      [Sections.RECORD_TYPES]: <p>Record Types TODO</p>,
      [Sections.RELATED_LISTS]: <p>Related Lists TODO</p>,
    };

    if (sectionKey === Sections.FIELDS) {
      if (!recordId) {
        return (
          <SetupSectionFieldsListView
            tableKey={tableKey}
            sectionKey={sectionKey}
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

    return screens[sectionKey] ?? <p>Sezione non trovata</p>;
  };

  return pickScreen();
}
