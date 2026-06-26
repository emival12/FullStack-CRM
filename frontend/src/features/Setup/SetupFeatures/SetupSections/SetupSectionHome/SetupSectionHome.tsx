import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext } from "react-router-dom";

import { ObjectDefinitionItem } from "@/types/object.types";
import { SetupOutletContext } from "@/types/routing.types";
import { ENDPOINTS } from "@/api/endpoints";
import { ApiError, CRUDResult } from "@/api/types";
import { ROUTES } from "@/config/routes";
import { useLabels } from "@/context/Label/Label";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useFeedback } from "@/hooks/useFeedback";
import DynamicForm from "@/components/dynamicUI/DynamicForm/DynamicForm";
import DynamicRecordActions from "@/components/dynamicUI/DynamicRecordActions/DynamicRecordActions";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import { HOME_OBJECT_FIELD_STRUCTURE } from "@/features/Setup/K_SetupFormsStructure";
import { SetupSectionBaseProps } from "@/features/Setup/SetupFeatures/SetupSections/SetupSections.types";

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
    data: objectData,
    loading: loadingForm,
    error,
    refetch,
  } = useApiQuery<ObjectDefinitionItem>(
    ENDPOINTS.setup.object.definition(tableKey ?? ""),
    { enabled: Boolean(tableKey) },
  );
  const { mutate, loading: loadingSubmit } = useApiMutation<
    Record<string, any>,
    CRUDResult
  >(ENDPOINTS.setup.object.update, "post");

  const formValues = objectData
    ? Object.fromEntries(
        Object.entries(HOME_OBJECT_FIELD_STRUCTURE).map(([key]) => [
          key,
          objectData[key.toLowerCase() as keyof ObjectDefinitionItem],
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
    if (!objectData || !tableKey || !sectionKey) return;

    const modified_data: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        objectData[key.toLowerCase() as keyof ObjectDefinitionItem] !== value
      ) {
        modified_data[key] = value;
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

  if (!objectData) return null;

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
        redirectAPI={ROUTES.setup.root}
        extraActionOnDelete={() => {
          setRefreshSidebar(!refreshSidebar);
        }}
      />
      <DynamicForm
        fields={HOME_OBJECT_FIELD_STRUCTURE}
        onSubmit={handleSubmit(onSubmit)}
        errors={errors}
        register={register}
        editability={isEdit ? "byField" : "none"}
      />
    </>
  );
}
