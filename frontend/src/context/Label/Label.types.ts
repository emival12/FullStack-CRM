export type GetLabelFunc = (
  labelName: string,
  params?: Record<string, any>,
) => string;

export interface LabelContextType {
  getLabel: GetLabelFunc;
}

export interface LabelProviderProps {
  children: React.ReactNode;
}

export type TranslationData = Record<string, any> | null;
