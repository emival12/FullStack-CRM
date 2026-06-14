import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import { Sections,SetupOutletContext } from "@/types/routing.types";
import { ENDPOINTS } from "@/api/endpoints";
import { ERROR_MISSING_TABLE } from "@/config/K";
import { useLabels } from "@/context/Label/Label";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useFeedback } from "@/hooks/useFeedback";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import MissingPage from "@/components/MissingPage/MissingPage";

import SetupSectionFieldsEdit from "./SetupSectionFieldsEdit/SetupSectionFieldsEdit";
import SetupSectionFieldsListView from "./SetupSectionFieldsListView/SetupSectionFieldsListView";
import SetupSectionHome from "./SetupSectionHome/SetupSectionHome";

export default function SetupSection(): React.ReactElement | null {
  const { tableKey, sectionKey, recordId } =
    useOutletContext<SetupOutletContext>();
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const { loading, error } = useApiQuery<unknown>(
    ENDPOINTS.setup.object.exists(tableKey ?? ""),
    { enabled: Boolean(tableKey) },
  );

  const isMissingTable = error?.errorCode === ERROR_MISSING_TABLE;

  useEffect(() => {
    if (error && !isMissingTable) showErrorToast(error, "SETUP_SECTIONS");
  }, [error, isMissingTable, showErrorToast]);

  const pickScreen = () => {
    if (!tableKey || !sectionKey) return null;

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

    return (
      screens[sectionKey] ?? (
        <MissingPage missingText={getLabel("MISSING.SECTION")} />
      )
    );
  };

  if (loading) return <LoadingScreen />;

  if (isMissingTable) {
    return <MissingPage missingText={getLabel("MISSING.TABLE")} />;
  }

  return pickScreen();
}
