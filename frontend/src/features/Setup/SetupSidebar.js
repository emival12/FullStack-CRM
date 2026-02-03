import axios from "axios";
import { useEffect, useState } from "react";
import { Form, FloatingLabel, ListGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

import { SETUP_TABLE_SELECTION_LABEL, TABLES_LABEL } from "../../config/IT";
import { API_BASE_URL, PATH_SETUP } from "../../config/K";
import { SECTIONS } from "./K_Setup";
import LoadingScreen from "../../components/LoadingScreen";
import ScreenAdaptiveSidebar from "../../components/ScreenAdaptiveSidebar";

/**
 * Shows a list of options, each option is a tables
 *
 * @param {String} props.tableKey             - Table currently selected
 * @param {String} props.sectionKey           - Section currently selected
 * @param {Boolean} props.refreshSidebar      - Boolean to understand if is need a refresh of the list of objects
 */
export default function SetupSidebar({ tableKey, sectionKey, refreshSidebar }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);

  //Mobile variables
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/plain_tables`)
      .then((res) => {
        console.log("SetupSidebar - List of Plain Tables Received:", res.data);
        setTables(res.data);
      })
      .catch((err) => console.error("SetupSidebar - Error:", err))
      .finally(() => setLoading(false));
  }, [refreshSidebar]);

  if (loading) return <LoadingScreen />;

  const sidebar = () => {
    return (
      <>
        <FloatingLabel
          controlId="floatingInput"
          label={SETUP_TABLE_SELECTION_LABEL}
          className="mb-3"
        >
          <Form.Select
            value={tableKey || ""}
            onChange={(e) => {
              toggleSidebar(); //useful only for the mobile

              const value = e.target.value || null;
              const path = value ? `${PATH_SETUP}/${value}` : PATH_SETUP;
              navigate(path);
            }}
          >
            <option value=""></option>
            {tables.map((table) => (
              <option key={table.key} value={table.key}>
                {table.label}
              </option>
            ))}
          </Form.Select>
        </FloatingLabel>

        {tableKey ? (
          <ListGroup className="mt-2" variant="pills">
            {SECTIONS.map((section) => (
              <ListGroup.Item
                action
                as={Link}
                to={`${PATH_SETUP}/${tableKey}/${section.key}`}
                key={section.key}
                active={section.key === sectionKey}
                onClick={() => {
                  toggleSidebar(); //useful only for the mobile
                }}
              >
                {section.label}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : null}
      </>
    );
  };

  return (
    <ScreenAdaptiveSidebar
      sidebarComponent={sidebar()}
      labelPhoneButton={TABLES_LABEL}
    />
  );
}
