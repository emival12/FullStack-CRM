import { Accordion } from "react-bootstrap";

import type { TablesSidebarAccordionProps } from "./TablesSidebar.types";
import TablesSidebarList from "./TablesSidebarList";

/**
 * Renders a tree of nested accordions, one level per group, recursing until a leaf is reached.
 * Each entry is discriminated on its `type`: a "group" recurses, a "leaf" renders as a selectable table.
 */
export default function TablesSidebarAccordion({
  tablesData,
  tableKey,
  toggleSidebar,
}: TablesSidebarAccordionProps): React.ReactElement {
  return (
    <Accordion alwaysOpen>
      {Object.entries(tablesData).map(([key, values]) => (
        <Accordion.Item eventKey={key} key={key}>
          <Accordion.Header>{key}</Accordion.Header>
          <Accordion.Body>
            {values.map((item) => {
              if (item.type === "group") {
                return (
                  <TablesSidebarAccordion
                    key={item.label}
                    tablesData={{ [item.label]: item.children }}
                    tableKey={tableKey}
                    toggleSidebar={toggleSidebar}
                  />
                );
              }

              return (
                <TablesSidebarList
                  key={item.key}
                  tableItem={item}
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
