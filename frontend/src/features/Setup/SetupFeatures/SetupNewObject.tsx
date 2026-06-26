import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext } from "react-router-dom";

import { SetupOutletContext } from "@/types/routing.types";
import { ENDPOINTS } from "@/api/endpoints";
import { ApiError, CRUDResult } from "@/api/types";
import { useLabels } from "@/context/Label/Label";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useFeedback } from "@/hooks/useFeedback";
import DynamicForm from "@/components/dynamicUI/DynamicForm/DynamicForm";
import DynamicRecordActions from "@/components/dynamicUI/DynamicRecordActions/DynamicRecordActions";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import { NEW_OBJECT_FIELD_STRUCTURE } from "@/features/Setup/K_SetupFormsStructure";

const PREFIX = "SETUP_NEW_OBJECT";

export default function SetupNewObject(): React.ReactElement {
  const { refreshSidebar, setRefreshSidebar } =
    useOutletContext<SetupOutletContext>();
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const { mutate, loading } = useApiMutation<Record<string, any>, CRUDResult>(
    ENDPOINTS.setup.object.create,
    "post",
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm();

  const [showNewForm, setShowNewForm] = useState(false);

  //Method fired when the button Save is pressed
  const onSubmit = async (data: Record<string, any>) => {
    const payload = {
      data: data,
    };

    try {
      await mutate(payload);
      setShowNewForm(false);

      setRefreshSidebar(!refreshSidebar);
      reset();
    } catch (err) {
      showErrorToast(err as ApiError, PREFIX);
    }
  };

  //Create the API name of the object
  const object_label_value = watch("object_label");
  useEffect(() => {
    if (!object_label_value) return;

    setValue(
      "object_name",
      object_label_value.replaceAll(" ", "_").toLowerCase(),
    );
  }, [object_label_value, setValue]);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <DynamicRecordActions
        editLabel={getLabel("BUTTONS.NEW")}
        isEdit={showNewForm}
        setIsEdit={setShowNewForm}
        reset={reset}
        errorPrefix={PREFIX}
        hasDeleteButton={false}
        extraDescription={getLabel("SETUP.SELECT_TABLE_MESSAGE")}
      />
      {showNewForm ? (
        <DynamicForm
          fields={NEW_OBJECT_FIELD_STRUCTURE}
          onSubmit={handleSubmit(onSubmit)}
          errors={errors}
          register={register}
          editability="byField"
        />
      ) : null}
    </>
  );
}
