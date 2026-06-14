import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

import { RecordListStructure } from "@/types/list.types";
import { ENDPOINTS } from "@/api/endpoints";
import { PATH_SETUP } from "@/config/K";
import { useLabels } from "@/context/Label/Label";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useFeedback } from "@/hooks/useFeedback";
import DynamicRecordsList from "@/components/dynamicUI/DynamicRecordsList/DynamicRecordsList";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import { SetupSectionBaseProps } from "@/features/Setup/SetupFeatures/SetupSections/SetupSections.types";

import NewFieldRecord from "./NewFieldRecord";

/**
 * Page used for the section Fields of an object in the setup
 */
export default function SetupSectionFieldsListView({
  tableKey,
  sectionKey,
}: SetupSectionBaseProps): React.ReactElement | null {
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const {
    data: records,
    loading,
    error,
    refetch,
  } = useApiQuery<RecordListStructure>(
    ENDPOINTS.setup.fields.recordsList(tableKey ?? ""),
    { enabled: Boolean(tableKey) },
  );

  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    if (error) showErrorToast(error, "SETUP_FIELDS_LIST");
  }, [error, showErrorToast]);

  if (loading) return <LoadingScreen />;

  if (!records) return null;

  return (
    <>
      <div className="d-flex flex-row-reverse pb-2 pt-2">
        <Button
          size="sm"
          onClick={() => {
            setShowNewModal(true);
          }}
        >
          {getLabel("BUTTONS.NEW")}
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
        refreshData={refetch}
      />
    </>
  );
}
