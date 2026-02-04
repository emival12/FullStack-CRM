import React from "react";
import { ENG } from "./Languages/ENG";
import { IT } from "./Languages/IT";

const labelNotFound = "Label Not Found";
const dictionaries = {
  it: IT,
  en: ENG,
};
dictionaries["it-IT"] = dictionaries.it;
dictionaries["en-US"] = dictionaries.en;
dictionaries["en-GB"] = dictionaries.en;

const getBrowserLanguage = () => {
  const browserLang = navigator.language;
  return dictionaries[browserLang] ? browserLang : "eng";
};

export const getLabel = (labelName, params = null) => {
  if (!labelName) return labelNotFound;
  const path = labelName.split(".");

  let currentStep = dictionaries[getBrowserLanguage()];
  for (const key of path) {
    if (currentStep && currentStep[key] !== undefined) {
      currentStep = currentStep[key];
    } else {
      return labelNotFound;
    }
  }

  const labelValue =
    typeof currentStep === "function" ? currentStep(params) : currentStep;
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
