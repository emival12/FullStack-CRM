import { ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";

import { ROUTES } from "@/config/routes";

import type { TablesSidebarListProps } from "./TablesSidebar.types";

/**
 * Shows a list of options, each option is a tables
 */
export default function TablesSidebarList({
  tableItem,
  tableKey,
  toggleSidebar,
  displayField = "label",
}: TablesSidebarListProps): React.ReactElement {
  return (
    <ListGroup variant="flush">
      <ListGroup.Item
        action
        as={Link}
        to={ROUTES.database.table(tableItem.key)}
        key={tableItem.key}
        active={tableItem.key === tableKey}
        onClick={toggleSidebar}
      >
        {tableItem[displayField]}
      </ListGroup.Item>
    </ListGroup>
  );
}
