import React from "react";
import { ENG } from "./Languages/ENG";
import { IT } from "./Languages/IT";

const dictionaries = {
  it: IT,
  eng: ENG,
};

const labelNotFound = "Label Not Found";
const userLanguage = "it";

export const getLabel = (labelName, params = null) => {
  if (!labelName) return labelNotFound;
  const path = labelName.split(".");

  let currentStep = dictionaries[userLanguage];
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
