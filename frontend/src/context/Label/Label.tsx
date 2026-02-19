import axios from "axios";
import React, { createContext, useContext, useState, useEffect } from "react";
import type {
  LabelContextType,
  LabelManagerProps,
  TranslationData,
  GetLabelFunc,
} from "./Label.types";

import { API_BASE_URL } from "config/K";

//Creation of context (place where i can save things and avoid the props)
const LabelContext = createContext<LabelContextType | null>(null);
export const useLabels = () => {
  const context = useContext(LabelContext);
  if (!context) {
    throw new Error(
      "useLabels deve essere usato all'interno di un LabelManager",
    );
  }

  return context;
};

export default function LabelManager({ children }: LabelManagerProps) {
  const labelNotFound = "Label Not Found";
  const browserLang = navigator.language;
  const [translationJson, setTranslationJson] = useState<TranslationData>(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/translations/${browserLang}`)
      .then((res) => {
        console.log("LabelManager - result:", res.data);
        setTranslationJson(res.data);
      })
      .catch((err) => {
        console.error("LabelManager - Error:", err);
        throw err;
      });
  }, [browserLang]);

  const getLabel: GetLabelFunc = (labelName, params = undefined) => {
    if (!labelName) return labelNotFound;
    const path = labelName.split(".");

    let currStep = translationJson;
    for (const key of path) {
      if (currStep && currStep[key] !== undefined) {
        currStep = currStep[key];
      } else {
        return labelNotFound;
      }
    }

    let labelValue = typeof currStep === "string" ? currStep : labelNotFound;
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          labelValue = labelValue.replaceAll(`{{${key}}}`, value);
        }
      });
    }

    return labelValue;
  };

  return (
    <LabelContext.Provider value={{ getLabel }}>
      {children}
    </LabelContext.Provider>
  );
}
