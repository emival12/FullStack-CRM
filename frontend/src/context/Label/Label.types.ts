export type GetLabelFunc = (
  labelName: string,
  params?: Record<string, string> | null,
) => React.ReactNode;

export interface LabelContextType {
  getLabel: GetLabelFunc;
}

export interface LabelManagerProps {
  children: React.ReactNode;
}

export type TranslationData = Record<string, any> | null;
