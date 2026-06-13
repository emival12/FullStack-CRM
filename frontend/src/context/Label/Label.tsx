import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import type {
  LabelContextType,
  LabelProviderProps,
  TranslationData,
  GetLabelFunc,
} from "./Label.types";
import { ENDPOINTS } from "api/endpoints";
import client from "api/client";
import { ApiError } from "api/types";

//Creation of context (place where i can save things and avoid the props)
const LabelContext = createContext<LabelContextType | null>(null);
export const useLabels = () => {
  const context = useContext(LabelContext);
  if (!context) {
    throw new Error("useLabels must be used within LabelProvider");
  }

  return context;
};

export default function LabelProvider({ children }: LabelProviderProps) {
  const browserLang = navigator.language;
  const [translationJson, setTranslationJson] = useState<TranslationData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get(ENDPOINTS.config.translations(browserLang))
      .then((res) => setTranslationJson(res.data))
      .catch((err) => {
        const apiError = err as ApiError;
        console.error(
          "Translation file retrieve failed:",
          apiError.errorCode,
          apiError.errorData,
        );
      })
      .finally(() => setLoading(false));
  }, [browserLang]);

  const getLabel: GetLabelFunc = useCallback(
    (labelName, params) => {
      const path = labelName.split(".");
      let currStep = translationJson;
      for (const key of path) {
        if (currStep && currStep[key] !== undefined) {
          currStep = currStep[key];
        } else {
          return labelName;
        }
      }

      let labelValue = typeof currStep === "string" ? currStep : labelName;
      if (params) {
        Object.keys(params).forEach((key) => {
          const value = params[key];
          if (value !== undefined && value !== null) {
            labelValue = labelValue.replaceAll(`{{${key}}}`, value);
          }
        });
      }

      return labelValue;
    },
    [translationJson],
  );

  const value = useMemo(
    () => ({ getLabel, loading, language: browserLang }),
    [getLabel, loading, browserLang],
  );
  return (
    <LabelContext.Provider value={value}>{children}</LabelContext.Provider>
  );
}
