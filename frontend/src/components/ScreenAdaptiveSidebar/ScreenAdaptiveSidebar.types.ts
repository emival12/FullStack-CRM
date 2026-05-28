export interface ScreenAdaptiveSidebarProps {
  /** Component showed inside the sidebar */
  sidebarComponent: React.ReactElement | null;

  /** Label used in the mobile button visualization */
  labelPhoneButton: string;

  /** Function used to Open/Close the sidebar */
  toggleSidebar: () => void;

  /** Flag to undestand if he should Open/Close the sidebar */
  showSidebar: boolean;
}

export interface DesktopSidebarProps {
  /** Component showed inside the sidebar */
  sidebarComponent: ScreenAdaptiveSidebarProps["sidebarComponent"];
}
