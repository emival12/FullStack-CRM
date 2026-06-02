import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext } from "react-router-dom";

import { SetupSectionBaseProps } from "../SetupSections.types";
import { SetupOutletContext } from "types/routing.types";
import { MetadataFieldStructure } from "types/field.types";
import { ApiError, CRUDResult } from "api/types";
import { PATH_SETUP } from "config/K";
import { ENDPOINTS } from "api/endpoints";
import { useLabels } from "context/Label/Label";
import { useFeedback } from "hooks/useFeedback";
import { useApiQuery } from "hooks/useApiQuery";
import { useApiMutation } from "hooks/useApiMutation";
import { HOME_OBJECT_FIELD_STRUCTURE } from "features/Setup/K_SetupFormsStructure";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";
import DynamicRecordActions from "components/dynamicUI/DynamicRecordActions/DynamicRecordActions";

const PREFIX = "SETUP_HOME";

/**
 * Page used for the section Home of an object in the setup
 */
export default function SetupSectionHome({
  tableKey,
  sectionKey,
}: SetupSectionBaseProps): React.ReactElement | null {
  const { refreshSidebar, setRefreshSidebar } =
    useOutletContext<SetupOutletContext>();
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const {
    data: fields,
    loading: loadingForm,
    error,
    refetch,
  } = useApiQuery<MetadataFieldStructure>(
    ENDPOINTS.setup.object.definition(tableKey ?? ""),
    { enabled: Boolean(tableKey) },
  );
  const { mutate, loading: loadingSubmit } = useApiMutation<
    Record<string, any>,
    CRUDResult
  >(ENDPOINTS.setup.object.update, "post");

  const formValues = fields
    ? Object.fromEntries(
        Object.entries(HOME_OBJECT_FIELD_STRUCTURE).map(([key, info]) => [
          key,
          fields[key.toLowerCase()],
        ]),
      )
    : undefined;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ values: formValues });

  const [isEdit, setIsEdit] = useState(false);
  const loading = loadingForm || loadingSubmit;

  useEffect(() => {
    if (error) showErrorToast(error, PREFIX);
  }, [error, showErrorToast]);

  //Method fired when the button Save is pressed
  const onSubmit = async (data: Record<string, any>) => {
    if (!fields || !tableKey || !sectionKey) return;

    let modified_data: Record<string, any> = {};
    for (const key in data) {
      if (fields[key.toLowerCase()] !== data[key]) {
        modified_data[key] = data[key];
      }
    }

    if (Object.keys(modified_data).length > 0) {
      const payload = {
        table: tableKey,
        field: modified_data,
      };

      try {
        await mutate(payload);
        setIsEdit(false);
        refetch();
      } catch (err) {
        showErrorToast(err as ApiError, PREFIX);
      }
    }
  };

  if (loading) return <LoadingScreen />;

  if (!fields) return null;

  return (
    <>
      <DynamicRecordActions
        editLabel={getLabel("BUTTONS.EDIT")}
        isEdit={isEdit}
        setIsEdit={setIsEdit}
        reset={reset}
        errorPrefix={PREFIX}
        hasDeleteButton={true}
        pathAPI={ENDPOINTS.setup.object.delete}
        payloadAPI={{
          table: tableKey,
        }}
        redirectAPI={PATH_SETUP}
        extraActionOnDelete={() => {
          setRefreshSidebar(!refreshSidebar);
        }}
      />
      <DynamicForm
        fields={HOME_OBJECT_FIELD_STRUCTURE}
        validated={false}
        onSubmit={handleSubmit(onSubmit)}
        errors={errors}
        register={register}
        isEdit={isEdit}
      />
    </>
  );
}
