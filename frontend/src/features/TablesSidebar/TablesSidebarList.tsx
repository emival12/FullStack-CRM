import { ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import type { TablesSidebarListProps } from "./TableSidebar.types";

import { PATH_DATABASE } from "config/K";

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
        to={`${PATH_DATABASE}/${tableItem.key}`}
        key={tableItem.key}
        active={tableItem.key === tableKey}
        onClick={toggleSidebar}
      >
        {tableItem[displayField]}
      </ListGroup.Item>
    </ListGroup>
  );
}
