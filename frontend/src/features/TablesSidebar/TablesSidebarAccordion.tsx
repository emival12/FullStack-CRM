import { Accordion } from "react-bootstrap";
import type {
  SidebarItem,
  SidebarStructure,
  TablesSidebarAccordionProps,
} from "./TableSidebar.types";

import TablesSidebarList from "./TablesSidebarList";

/**
 * Shows a series of accordion, continues to shows accordion until it reach the deepes level
 * On the deepest level there is a list of options, each option is a tables
 */
export default function TablesSidebarAccordion({
  tablesData,
  tableKey,
  toggleSidebar,
}: TablesSidebarAccordionProps): React.ReactElement {
  return (
    <Accordion alwaysOpen>
      {Object.entries(tablesData).map(([key, value]) => (
        <Accordion.Item eventKey={key} key={key}>
          <Accordion.Header>{key}</Accordion.Header>
          <Accordion.Body>
            {Object.entries(value).map(([idx, item]) => {
              const keys = Object.keys(item);
              if (keys.length === 1) {
                return (
                  <TablesSidebarAccordion
                    key={idx}
                    tablesData={item as SidebarStructure}
                    tableKey={tableKey}
                    toggleSidebar={toggleSidebar}
                  />
                );
              }

              return (
                <TablesSidebarList
                  key={idx}
                  tableItem={item as SidebarItem}
                  tableKey={tableKey}
                  toggleSidebar={toggleSidebar}
                />
              );
            })}
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
