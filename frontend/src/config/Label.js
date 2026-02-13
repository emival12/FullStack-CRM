import axios from "axios";
import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "./K";

//Creation of context (place where i can save things and avoid the props)
const LabelContext = createContext();
export const useLabels = () => useContext(LabelContext);

export default function LabelManager({ children }) {
  const labelNotFound = "Label Not Found";
  const browserLang = navigator.language;
  const [translationJson, setTranslationJson] = useState(null);

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

  const getLabel = (labelName, params = null) => {
    if (!labelName) return labelNotFound;
    const path = labelName.split(".");

    let currentStep = translationJson;
    for (const key of path) {
      if (currentStep && currentStep[key] !== undefined) {
        currentStep = currentStep[key];
      } else {
        return labelNotFound;
      }
    }

    let labelValue = currentStep;
    if (params) {
      Object.keys(params).forEach((key) => {
        labelValue = labelValue.replace(`{{${key}}}`, params[key]);
      });
    }

    return typeof labelValue === "string" && labelValue.includes("\n")
      ? multiLineFormatter(labelValue)
      : labelValue;
  };

  // Add a <br /> to go on the net line every time he finds \n
  const multiLineFormatter = (textMsg) => {
    return textMsg.split("\n").map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <LabelContext.Provider value={{ getLabel }}>
      {children}
    </LabelContext.Provider>
  );
}
