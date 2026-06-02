export interface NewRecordProps {
  /** Key of the table currently selected */
  tableKey: string;

  /** Flag to decide to show or hide the modal */
  showNewModal: boolean;

  /** Set method of the flag showNewModal */
  setShowNewModal: (showNewModal: boolean) => void;

  /** Function to run the refresh on the record list */
  refreshData: () => void;
}
