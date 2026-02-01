import { ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PATH_DATABASE } from "../../config/K";

/**
 * Shows a list of options, each option is a tables
 *
 * @param {Object[]} props.tableItem        - Record to show
 * @param {String} props.tableKey           - Table Key currently selected
 * @param {Function} props.toggleSidebar    - Function to close the Sidebar (phone sidebar only)
 * @param {String} props.displayField       - Field to show in the frontend
 */
export default function TablesSidebarList({
  tableItem,
  tableKey,
  toggleSidebar,
  displayField = "label",
}) {
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
