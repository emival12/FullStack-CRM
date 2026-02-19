export interface NewFieldRecordProps {
  /** Key of the table selected: table_name */
  tableKey: string | undefined;

  /** Flag to decide to show or hide the modal */
  showNewModal: boolean;

  /** Set method of the flag showNewModal */
  setShowNewModal: (showNewModal: boolean) => void;

  /** Function executed to refresh the record list */
  refreshData: () => void;
}
