import pytest
from fastapi import HTTPException
from datetime import datetime, timedelta
from core.models import TriggerDefTiming, TriggerDefEvent, RldFilterConditions, MASTER_RECORD_TYPE
from db.db_queries import (
    make_table_key,
    make_options_key,
    make_rollup_key,
    make_table_key_from_row,
    make_basic_table_key,
    make_options_key_from_row,
    make_rollup_key_from_row,
    check_allowed_object,
    check_allowed_table,
    get_object_definition_records,
    get_object_definition_records_join_rt,
    get_list_view_definition_fields,
    get_record_layout_definition_fields,
    get_fields_definition,
    get_fields_definition_by_object_names,
    get_primary_keys_from_multiple_objects,
    get_related_list_definition_fields,
    get_trigger_definition,
    get_rollup_definitions_by_detail_object,
    get_fields_referencing_object,
    get_radio_options,
    get_rollup_definition,
    get_rollup_definition_by_master_field,
    get_picklist_lookup_options,
    get_user_definition_record,
    get_user_definition_record_by_token,
    get_single_record,
    get_records_from_table,
    get_field_divided_by_type,
    calculate_query_clause,
    get_primary_key_from_fields,
    group_object_definition_by_category,
    get_fields_with_label,
    get_next_sort_order,
    get_lookup_field_definition
)
from db.query_builder import QueryBuilderJoinType

def test_make_table_key():
    result = make_table_key("account", "master")
    assert result == "account-master"

def test_make_options_key():
    result = make_options_key("account", "master", "priority")
    assert result == "account-master-priority"

def test_make_rollup_key():
    result = make_rollup_key("contact", "master", "account", "account")
    assert result == "contact-master-account-account"

def test_make_table_key_from_row():
    row = {
        "object_name": "account", 
        "record_type_name": "master"
    }

    result = make_table_key_from_row(row)
    assert result == "account-master"

def test_make_basic_table_key():
    row = {
        "object_name": "account", 
    }

    result = make_basic_table_key(row)
    assert result == "account"

def test_make_options_key_from_row():
    row = {
        "object_name": "account", 
        "record_type_name": "master",
        "field_name": "priority"
    }

    result = make_options_key_from_row(row)
    assert result == "account-master-priority"

def test_make_rollup_key_from_rollup_row():
    row = {
        "master_object_name": "account", 
        "master_record_type_name": "master", 
        "master_field_name": "tot_numero_contatti", 
        "detail_object_name": "contact"
    }

    result = make_rollup_key_from_row(row)                                 
    assert result == "account-master-tot_numero_contatti-contact"

def test_make_rollup_key_from_lookup_row():
    row = {
        "object_name": "contact", 
        "record_type_name": "master", 
        "field_name": "accountId", 
        "reference_object": "account"
    }

    result = make_rollup_key_from_row(row)                                 
    assert result == "contact-master-accountId-account"

########## END - Key Builders ##########

def test_check_allowed_object_found(cursor):
    check_allowed_object(cursor, "product")

def test_check_allowed_object_not_found(cursor):
    with pytest.raises(HTTPException) as e:
        check_allowed_object(cursor, "non_existing_object")

    assert e.value.status_code == 404
    assert e.value.detail["error_code"] == "INPUT_TABLE_NAME_NOT_FOUND"

def test_check_allowed_table_found(cursor):
    check_allowed_table(cursor, "product-master")

def test_check_allowed_table_inactive(cursor):
    with pytest.raises(HTTPException) as e:
        check_allowed_table(cursor, "account-master")

    assert e.value.status_code == 404
    assert e.value.detail["error_code"] == "INPUT_TABLE_NAME_NOT_FOUND"

def test_check_allowed_table_not_found(cursor):
    with pytest.raises(HTTPException) as e:
        check_allowed_table(cursor, "non_existing_object")

    assert e.value.status_code == 404
    assert e.value.detail["error_code"] == "INPUT_TABLE_NAME_NOT_FOUND"

def test_get_object_definition_records(cursor):
    tables = get_object_definition_records(cursor)
    assert tables == [
        {
            "object_label":             "product",
            "object_name":              "product",
            "category":                 "Sales",
            "sort_order":               1,
            "is_system_object":         0,
            "is_single_record_type":    1,
            "key":                      "product",
            "label":                    "Product" 
        },
        {
            "object_label":             "account",
            "object_name":              "account",
            "category":                 "Sales",
            "sort_order":               2,
            "is_system_object":         0,
            "is_single_record_type":    0,
            "key":                      "account",
            "label":                    "Account" 
        },
        {
            "object_label":             "contact",
            "object_name":              "contact",
            "category":                 "Sales",
            "sort_order":               3,
            "is_system_object":         0,
            "is_single_record_type":    1,
            "key":                      "contact",
            "label":                    "Contact" 
        }
    ]

@pytest.mark.parametrize("object_names, expected", [
    (None,                   ["product", "account", "contact"]),
    ([],                     ["product", "account", "contact"]),
    (["product"],            ["product"]),
    (["contact", "product"], ["product", "contact"]),
    (["user_definition"],    []),
], ids=["no_filter", "empty_list", "single", "multiple", "system_object"])
def test_get_object_definition_records_filtered(cursor, object_names, expected):
    tables = get_object_definition_records(cursor, object_names)
    assert [row["object_name"] for row in tables] == expected

def test_get_object_definition_records_join_rt(cursor):
    tables = get_object_definition_records_join_rt(cursor)
    assert tables == [
        {
            "object_label":             "product",
            "object_name":              "product",
            "record_type_name":         "master",
            "is_active":                1,
            "category":                 "Sales",
            "sort_order":               1,
            "is_system_object":         0,
            "is_single_record_type":    1,
            "key":                      "product-master",
            "label":                    "Product" 
        },
        {
            "object_label":             "account",
            "object_name":              "account",
            "record_type_name":         "cliente",
            "is_active":                1,
            "category":                 "Sales",
            "sort_order":               2,
            "is_system_object":         0,
            "is_single_record_type":    0,
            "key":                      "account-cliente",
            "label":                    "Cliente" 
        },
        {
            "object_label":             "account",
            "object_name":              "account",
            "record_type_name":         "fornitore",
            "is_active":                1,
            "category":                 "Sales",
            "sort_order":               2,
            "is_system_object":         0,
            "is_single_record_type":    0,
            "key":                      "account-fornitore",
            "label":                    "Fornitore" 
        },
        {
            "object_label":             "contact",
            "object_name":              "contact",
            "record_type_name":         "master",
            "is_active":                1,
            "category":                 "Sales",
            "sort_order":               3,
            "is_system_object":         0,
            "is_single_record_type":    1,
            "key":                      "contact-master",
            "label":                    "Contact" 
        },
    ]

@pytest.mark.parametrize("object_names, active_rt, expected", [
    (None,                   1, ["product-master", "account-cliente", "account-fornitore", "contact-master"]),
    ([],                     1, ["product-master", "account-cliente", "account-fornitore", "contact-master"]),
    (["product"],            1, ["product-master"]),
    (["contact", "product"], 1, ["product-master", "contact-master"]),
    (["user_definition"],    1, []),
    (None,                   0, ["product-master", "account-cliente", "account-fornitore", "account-master", "contact-master"]),
], ids=["no_filter", "empty_list", "single", "multiple", "system_object", "no_rt_filter"])
def test_get_object_definition_records_join_rt_filtered(cursor, object_names, active_rt, expected):
    tables = get_object_definition_records_join_rt(cursor, object_names, active_rt)
    assert [row["key"] for row in tables] == expected

def test_get_list_view_definition_fields(cursor):
    fields = get_list_view_definition_fields(cursor, [("contact", "master"), ("account","master")])
    assert fields == {
        "contact-master": [
            {
                "object_name":          "contact",
                "record_type_name":     "master",
                "field_name":           "telefono",
                "field_type":           "text",
                "reference_object":     None,
                "reference_field":      None,
                "is_primary_key":       1,
                "lookup_filter":        None,
                "formula_definition":   None,
            }
        ]
    }

@pytest.mark.parametrize("list_params, expected", [
    (None,                                           {}),
    ([],                                             {}),
    ([("contact", "master")],                        {"contact-master": ["telefono"]}),
    ([("account", "master")],                        {}),
    ([("contact", "master"), ("account", "master")], {"contact-master": ["telefono"]}),
    ([("nonexistent", "master")],                    {}),
], ids=["no_filter", "empty_input", "single", "inactive_field", "mixed", "nonexistent"])
def test_get_list_view_definition_fields_filtered(cursor, list_params, expected):
    tables = get_list_view_definition_fields(cursor, list_params)
    assert { key: [row["field_name"] for row in rows] for key, rows in tables.items() } == expected

def test_get_record_layout_definition_fields(cursor):
    fields = get_record_layout_definition_fields(cursor, "contact", "master")
    assert fields == [
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "telefono",
            "field_type":           "text",
            "length":               255,
            "numeric_precision":    None,
            "numeric_scale":        None,
            "reference_object":     None,
            "reference_field":      None,
            "is_editable":          1,
            "is_required":          1,
            "is_primary_key":       1,
            "lookup_filter":        None,
            "formula_definition":   None,
        },
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "create_date",
            "field_type":           "datetime-local",
            "length":               None,
            "numeric_precision":    None,
            "numeric_scale":        None,
            "reference_object":     None,
            "reference_field":      None,
            "is_editable":          0,
            "is_required":          0,
            "is_primary_key":       0,
            "lookup_filter":        None,
            "formula_definition":   None,
        },
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "last_modified_date",
            "field_type":           "datetime-local",
            "length":               None,
            "numeric_precision":    None,
            "numeric_scale":        None,
            "reference_object":     None,
            "reference_field":      None,
            "is_editable":          0,
            "is_required":          0,
            "is_primary_key":       0,
            "lookup_filter":        None,
            "formula_definition":   None,
        },
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "last_modified_by",
            "field_type":           "lookup",
            "length":               255,
            "numeric_precision":    None,
            "numeric_scale":        None,
            "reference_object":     "user_definition",
            "reference_field":      "email",
            "is_editable":          0,
            "is_required":          0,
            "is_primary_key":       0,
            "lookup_filter":        None,
            "formula_definition":   None,
        },
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "account",
            "field_type":           "lookup",
            "length":               None,
            "numeric_precision":    None,
            "numeric_scale":        None,
            "reference_object":     "account",
            "reference_field":      "id",
            "is_editable":          1,
            "is_required":          1,
            "is_primary_key":       0,
            "lookup_filter":        "",
            "formula_definition":   None,
        },
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "priority",
            "field_type":           "radio",
            "length":               255,
            "numeric_precision":    None,
            "numeric_scale":        None,
            "reference_object":     None,
            "reference_field":      None,
            "is_editable":          1,
            "is_required":          0,
            "is_primary_key":       0,
            "lookup_filter":        None,
            "formula_definition":   None,
        },
    ]

@pytest.mark.parametrize("table_name, record_type_name, filter_condition, is_active, expected", [
    ("contact", "master", RldFilterConditions.VISIBLE,              1, ["telefono", "create_date", "last_modified_date", "last_modified_by", "account", "priority"]),
    ("contact", "master", RldFilterConditions.VISIBLE_AND_EDITABLE, 1, ["telefono", "account", "priority"]),
    ("contact", "master", RldFilterConditions.VISIBLE_AND_EDITABLE, 0, ["telefono", "account", "priority", "inactive_field"]),
], ids=["active_visible_fields", "active_visible_and_editable_fields", "visible_and_editable_fields"])
def test_get_record_layout_definition_fields_filtered(cursor, table_name, record_type_name, filter_condition, is_active, expected):
    tables = get_record_layout_definition_fields(cursor, table_name, record_type_name, filter_condition, is_active)
    assert [row["field_name"] for row in tables] == expected

def test_get_fields_definition(cursor):
    fields = get_fields_definition(cursor, [("product", "master")])  
    assert fields ==  {
        "product-master": [
            {
                "object_name":          "product",
                "record_type_name":     "master",
                "field_name":           "create_date",
                "field_type":           "datetime-local",
                "length":               None,
                "numeric_precision":    None,
                "numeric_scale":        None,
                "reference_object":     None,
                "reference_field":      None,
                "is_editable":          0,
                "is_required":          0,
                "is_primary_key":       0,
                "lookup_filter":        None,
                "formula_definition":   None,
            },
            {
                "object_name":          "product",
                "record_type_name":     "master",
                "field_name":           "id",
                "field_type":           "auto_number",
                "length":               None,
                "numeric_precision":    None,
                "numeric_scale":        None,
                "reference_object":     None,
                "reference_field":      None,
                "is_editable":          0,
                "is_required":          0,
                "is_primary_key":       1,
                "lookup_filter":        None,
                "formula_definition":   None,
            },
            {
                "object_name":          "product",
                "record_type_name":     "master",
                "field_name":           "last_modified_by",
                "field_type":           "lookup",
                "length":               255,
                "numeric_precision":    None,
                "numeric_scale":        None,
                "reference_object":     "user_definition",
                "reference_field":      "email",
                "is_editable":          0,
                "is_required":          0,
                "is_primary_key":       0,
                "lookup_filter":        None,
                "formula_definition":   None,
            },
            {
                "object_name":          "product",
                "record_type_name":     "master",
                "field_name":           "last_modified_date",
                "field_type":           "datetime-local",
                "length":               None,
                "numeric_precision":    None,
                "numeric_scale":        None,
                "reference_object":     None,
                "reference_field":      None,
                "is_editable":          0,
                "is_required":          0,
                "is_primary_key":       0,
                "lookup_filter":        None,
                "formula_definition":   None,
            }
        ]
    }

@pytest.mark.parametrize("list_params, is_visible, is_active, field_name, expected", [
    (None,                      1, 1, None,         {}),
    ([],                        1, 1, None,         {}),
    ([("contact", "master")],   1, 1, None,         {"contact-master": ["account", "create_date", "last_modified_by", "last_modified_date", "priority", "telefono"]}),
    ([("contact", "master")],   0, 1, None,         {"contact-master": ["account", "counter", "create_date", "last_modified_by", "last_modified_date", "priority", "record_type_name", "telefono"]}),
    ([("contact", "master")],   1, 0, None,         {"contact-master": ["account", "create_date", "inactive_field", "last_modified_by", "last_modified_date", "priority", "telefono"]}),
    ([("contact", "master")],   0, 0, None,         {"contact-master": ["account", "counter", "create_date", "inactive_field", "last_modified_by", "last_modified_date", "priority", "record_type_name", "telefono"]}),
    ([("contact", "master")],   1, 1, "telefono",   {"contact-master": ["telefono"]}),
], ids=["no_filter", "empty_input", "active_and_visibile_fields", "active_fields", "visible_fields", "all_fields", "specific_fields"])
def test_get_fields_definition_filtered(cursor, list_params, is_visible, is_active, field_name, expected):
    fields = get_fields_definition(cursor, list_params, is_visible, is_active, field_name)
    assert { key: [row["field_name"] for row in rows] for key, rows in fields.items() } == expected

def test_get_fields_definition_by_object_names(cursor):
    fields = get_fields_definition_by_object_names(cursor, ["product"])
    assert fields ==  [
        {
            "object_name":          "product",
            "record_type_name":     "master",
            "field_name":           "create_date",
            "field_type":           "datetime-local",
            "reference_object":     None
        },
        {
            "object_name":          "product",
            "record_type_name":     "master",
            "field_name":           "id",
            "field_type":           "auto_number",
            "reference_object":     None
        },
        {
            "object_name":          "product",
            "record_type_name":     "master",
            "field_name":           "last_modified_by",
            "field_type":           "lookup",
            "reference_object":     "user_definition"
        },
        {
            "object_name":          "product",
            "record_type_name":     "master",
            "field_name":           "last_modified_date",
            "field_type":           "datetime-local",
            "reference_object":     None
        }
    ]

@pytest.mark.parametrize("object_names, is_active, record_type_name, expected", [
    (None,                      1, None,                []),
    ([],                        1, None,                []),
    (["contact"],               1, None,                ["account", "counter", "create_date", "last_modified_by", "last_modified_date", "priority", "telefono"]),
    (["contact"],               1, MASTER_RECORD_TYPE,  ["account", "counter", "create_date", "last_modified_by", "last_modified_date", "priority", "telefono"]),
    (["contact"],               0, None,                ["account", "counter", "create_date", "inactive_field", "last_modified_by", "last_modified_date", "priority", "telefono"]),
    (["account"],               1, None,                ['create_date', 'create_date', 'id', 'id', 'last_modified_by', 'last_modified_by', 'last_modified_date', 'last_modified_date', 'tot_contacts', 'tot_contacts']),
    (["account"],               0, MASTER_RECORD_TYPE,  ['create_date', 'id', 'inactive_rollup', 'last_modified_by', 'last_modified_date','tot_contacts']),
    (["contact", "product"],    1, None,                ["account", "counter", "create_date", "create_date", "id", "last_modified_by", "last_modified_by", "last_modified_date", "last_modified_date", "priority", "telefono"]),
], ids=["no_filter", "empty_input", "active_fields", "active_fields_master_rt", "all_fields", "multi_rt_object", "multi_rt_object_master_rt", "multiple_objects"])
def test_get_fields_definition_by_object_names_filtered(cursor, object_names, is_active, record_type_name, expected):
    tables = get_fields_definition_by_object_names(cursor, object_names, is_active, record_type_name)
    assert [row["field_name"] for row in tables] == expected

@pytest.mark.parametrize("object_names, expected", [
    (None,                      {}),
    ([],                        {}),
    (["product"],               {"product": "id"}),
    (["product", "contact"],    {"contact": "telefono", "product": "id"}),
], ids=["no_filter", "empty_input", "single", "multiple"])
def test_get_primary_keys_from_multiple_objects(cursor, object_names, expected):
    pks = get_primary_keys_from_multiple_objects(cursor, object_names)
    assert pks == expected

def test_get_related_list_definition_fields_found(cursor):
    related_lists = get_related_list_definition_fields(cursor, "account", "cliente")
    assert related_lists ==  [
        {
            "master_object_name":           "account",
            "master_record_type_name":      "cliente",
            "child_object_name":            "contact",
            "child_record_type_name":       "master",
            "child_primary_key":            "telefono",
            "child_join_key":               "account",
            "label":                        "Contact",
            "sort_order":                   1,
            "filter_condition":             None,
            "is_active":                    1
        }
    ]

def test_get_related_list_definition_fields_inactive(cursor):
    related_lists = get_related_list_definition_fields(cursor, "account", "master")
    assert related_lists ==  []

def test_get_trigger_definition_found(cursor):
    triggers = get_trigger_definition(cursor, "product", TriggerDefTiming.AFTER, TriggerDefEvent.INSERT)
    assert triggers ==  [
        {
            "object_name":      "product",
            "trigger_timing":   "AFTER",
            "trigger_event":    "INSERT",
            "is_active":        1,
        }
    ]

def test_get_trigger_definition_inactive(cursor):
    triggers = get_trigger_definition(cursor, "product", TriggerDefTiming.BEFORE, TriggerDefEvent.INSERT)
    assert triggers ==  []

def test_get_rollup_definitions_by_detail_object(cursor):
    rollups = get_rollup_definitions_by_detail_object(cursor, "contact")
    assert rollups ==  [
        {
            "master_object_name":       "account",
            "master_record_type_name":  "cliente",
            "detail_join_key":          "account"
        },
        {
            "master_object_name":       "account",
            "master_record_type_name":  "fornitore",
            "detail_join_key":          "account"
        }
    ]

def test_get_fields_referencing_object(cursor):
    lookups = get_fields_referencing_object(cursor, "account")
    assert lookups ==  [
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "account"
        }
    ]

def test_get_radio_options_empty_input(cursor):
    radio_options = get_radio_options(cursor, [])
    assert radio_options == {}

def test_get_radio_options(cursor):
    fields = [
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "priority",
            "lookup_filter":        None
        }
    ]

    radio_options = get_radio_options(cursor, fields)
    assert radio_options ==  {
        "contact-master-priority": [
            {
                "object_name":          "contact",
                "record_type_name":     "master",
                "field_name":           "priority",
                "option_label":         "High",
                "option_key":           "high"
            },
            {
                "object_name":          "contact",
                "record_type_name":     "master",
                "field_name":           "priority",
                "option_label":         "Medium",
                "option_key":           "medium"
            },
            {
                "object_name":          "contact",
                "record_type_name":     "master",
                "field_name":           "priority",
                "option_label":         "Low",
                "option_key":           "low"
            },
        ]
    }

@pytest.mark.parametrize("lookup_filter, expected", [
    (None,                                                  {"contact-master-priority": ["high", "medium", "low"]}),
    ("radio_checkbox_options__tab.option_key = 'medium'",   {"contact-master-priority": ["medium"]}),
], ids=["no_filter", "simple_filter"])
def test_get_radio_options_filtered(cursor, lookup_filter, expected):
    fields = [
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "priority",
            "lookup_filter":        lookup_filter
        }
    ]

    radio_options = get_radio_options(cursor, fields)
    assert { key: [row["option_key"] for row in rows] for key, rows in radio_options.items() } == expected

def test_get_rollup_definition_empty_input(cursor):
    rollups = get_rollup_definition(cursor, [])
    assert rollups == {}

def test_get_rollup_definition(cursor):
    fields = [
        {
            "object_name":          "account",
            "record_type_name":     "cliente",
            "field_name":           "tot_contacts",
            "reference_object":     "contact"
        }
    ]

    rollups = get_rollup_definition(cursor, fields)
    assert rollups ==  {
        "account-cliente-tot_contacts-contact": {
            "master_object_name":       "account",
            "master_record_type_name":  "cliente",
            "master_primary_key":       "id",
            "master_field_name":        "tot_contacts",
            "detail_object_name":       "contact",
            "detail_join_key":          "account",
            "detail_field_name":        "counter",
            "aggregation_function":     "SUM",
            "filter_condition":         None
        }
    }

def test_get_rollup_definition_by_master_field(cursor):
    rollups = get_rollup_definition_by_master_field(cursor, "tot_contacts")
    assert rollups ==  [
        {
            "master_object_name":       "account",
            "master_record_type_name":  "cliente",
            "master_primary_key":       "id",
            "master_field_name":        "tot_contacts",
            "detail_object_name":       "contact",
            "detail_join_key":          "account",
            "detail_field_name":        "counter",
            "aggregation_function":     "SUM",
            "filter_condition":         None
        },
        {
            "master_object_name":       "account",
            "master_record_type_name":  "fornitore",
            "master_primary_key":       "id",
            "master_field_name":        "tot_contacts",
            "detail_object_name":       "contact",
            "detail_join_key":          "account",
            "detail_field_name":        "counter",
            "aggregation_function":     "SUM",
            "filter_condition":         None
        },
        {
            "master_object_name":       "account",
            "master_record_type_name":  "master",
            "master_primary_key":       "id",
            "master_field_name":        "tot_contacts",
            "detail_object_name":       "contact",
            "detail_join_key":          "account",
            "detail_field_name":        "counter",
            "aggregation_function":     "SUM",
            "filter_condition":         None
        }
    ]

def test_get_picklist_lookup_options(cursor):
    fields = [
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "account",
            "reference_object":     "account",
            "reference_field":      "id",
            "lookup_filter":        None
        }
    ]

    map_pk = {
        "account": "id"
    }

    lookup_options = get_picklist_lookup_options(cursor, fields, map_pk)
    assert lookup_options ==  {
        "contact-master-account": [
            {
                "reference_field":  1,
                "id":               1
            },
            {
                "reference_field":  3,
                "id":               3
            }
        ]
    }

@pytest.mark.parametrize("lookup_filter, expected", [
    (None,                    {"contact-master-account": [1, 3]}),
    ("account__tab.id < 2",   {"contact-master-account": [1]}),
], ids=["no_filter", "simple_filter"])
def test_get_picklist_lookup_options_filtered(cursor, lookup_filter, expected):
    fields = [
        {
            "object_name":          "contact",
            "record_type_name":     "master",
            "field_name":           "account",
            "reference_object":     "account",
            "reference_field":      "id",
            "lookup_filter":        lookup_filter
        }
    ]

    map_pk = {
        "account": "id"
    }

    lookup_options = get_picklist_lookup_options(cursor, fields, map_pk)
    assert { key: [row["id"] for row in rows] for key, rows in lookup_options.items() } == expected

def test_get_user_definition_record_without_key(cursor):
    with pytest.raises(HTTPException) as e:
        get_user_definition_record(cursor)

    assert e.value.status_code == 500
    assert e.value.detail["error_code"] == "ADMIN_ERROR" 

@pytest.mark.parametrize("email, user_id, expected", [
    ("admin@test.it",       None,   { "id": 1, "email": "admin@test.it", "profile_name": "System_Admin" }),
    ("inactive@test.it",    None,   None),
    (None,                  1,      { "id": 1, "email": "admin@test.it", "profile_name": "System_Admin" }),
    ("admin@test.it",       1,      { "id": 1, "email": "admin@test.it", "profile_name": "System_Admin" }),
    ("admin@test.it",       2,      None),
], ids=["active_user", "inactive_user", "user_id", "both_correct", "both_incoherent"])
def test_get_user_definition_record(cursor, email, user_id, expected):
    user = get_user_definition_record(cursor, email, user_id)
    if user is not None:
        password_hash = user.pop("password")
        assert password_hash.startswith("$2b$")
    assert user == expected

def test_get_user_definition_record_by_token_expired(cursor):
    command = """
    INSERT INTO user_session(token, user_id, expires_at)
    VALUES (%s, %s, %s);
    """
    params = ("token_test", 1, datetime.now() - timedelta(hours=1))
    cursor.execute(command, params)

    user = get_user_definition_record_by_token(cursor, "token_test")
    assert user is None

def test_get_user_definition_record_by_token_valid(cursor):
    command = """
    INSERT INTO user_session(token, user_id, expires_at)
    VALUES (%s, %s, %s);
    """
    params = ("token_test", 1, datetime.now() + timedelta(hours=1))
    cursor.execute(command, params)

    user = get_user_definition_record_by_token(cursor, "token_test")
    assert user == { "id": 1, "email": "admin@test.it", "profile_name": "System_Admin" }

def test_get_single_record_not_found(cursor):
    fields = [
        {
            "field_name": "id",
        }
    ]

    raw_filters = ["product__tab.id = %s"]
    raw_params  = ["not_existing_record_id"]
    with pytest.raises(HTTPException) as e:
        get_single_record(cursor, "product", fields, raw_filters, raw_params)

    assert e.value.status_code == 404
    assert e.value.detail["error_code"] == "INPUT_RECORD_ID_NOT_FOUND" 

def test_get_single_record_found(cursor):
    fields = [
        {
            "field_name": "id",
        }
    ]

    raw_filters = ["product__tab.id = %s"]
    raw_params  = [1]
    record = get_single_record(cursor, "product", fields, raw_filters, raw_params)
    assert record ==  {
        "id": 1,
    }

def test_get_field_divided_by_type():
    fields = [
        { "field_type":"text" },
        { "field_type":"radio" },
        { "field_type":"lookup" },
        { "field_type":"lookup" },
        { "field_type":"picklist" },
        { "field_type":"rollup" },
    ]
    fields_by_type = get_field_divided_by_type(fields)
    assert len(fields_by_type.radio_fields)              == 1 
    assert len(fields_by_type.picklist_lookup_fields)    == 3 
    assert len(fields_by_type.rollup_fields)             == 1 
    assert len(fields_by_type.formula_fields)            == 0

@pytest.mark.parametrize("map_object_primary_key_names, expected_join_column", [
    (None,                          "account__tab_account.id"),
    ({"account": "custom_id_name"}, "account__tab_account.custom_id_name"),
], ids=["without_map", "with_map"])
def test_calculate_query_clause(cursor, map_object_primary_key_names, expected_join_column):
    fields = [
        {
            "field_name":           "telefono",
            "field_type":           "text",
            "reference_object":     None,
            "reference_field":      None,
        },
        {
            "field_name":           "priority",
            "field_type":           "radio",
            "reference_object":     None,
            "reference_field":      None,
        },
        {
            "field_name":           "account",
            "field_type":           "lookup",
            "reference_object":     "account",
            "reference_field":      "id",
        },
    ]
    (select_fields, joins) = calculate_query_clause(cursor, "contact", fields, map_object_primary_key_names)
    assert select_fields == [
        "contact__tab.telefono",
        "radio_checkbox_options__tab_priority.option_label priority",
        "account__tab_account.id account",
    ]

    assert joins == [
        (
            QueryBuilderJoinType.LEFT, 
            "radio_checkbox_options",
            [("contact__tab.priority", "radio_checkbox_options__tab_priority.option_key")],   
            "radio_checkbox_options__tab_priority",
        ),
        (
            QueryBuilderJoinType.LEFT, 
            "account",
            [("contact__tab.account", expected_join_column)],
            "account__tab_account",
        )
    ] 

def test_get_records_from_table(cursor):
    fields = [
        {
            "field_name":           "id",
            "field_type":           "auto_number",
            "reference_object":     None,
            "reference_field":      None,
        },
    ]
    records = get_records_from_table(cursor, "product", "master", fields)
    assert records == [
        {
            "id": 2,
        },
        {
            "id": 1,
        },
    ]

def test_get_primary_key_from_fields_with_pk():
    fields = [
        {
            "field_name":"surname",
            "is_primary_key":0,
        },
        {
            "field_name":"id",
            "is_primary_key":1,
        },
        {
            "field_name":"name",
            "is_primary_key":0,
        },
    ]
    primary_key_field = get_primary_key_from_fields(fields)
    assert primary_key_field == "id"

def test_get_primary_key_from_fields_without_pk():
    fields = [
        {
            "field_name":"surname",
            "is_primary_key":0,
        },
        {
            "field_name":"name",
            "is_primary_key":0,
        },
    ]

    with pytest.raises(HTTPException) as e:
        get_primary_key_from_fields(fields)

    assert e.value.status_code == 500
    assert e.value.detail["error_code"] == "ADMIN_ERROR"

def test_group_object_definition_by_category():
    tables = [
        {
            "object_name":"account",
            "record_type_name":"cliente",
            "category":"Anagrafica",
            "is_single_record_type":0,
        },
        {
            "object_name":"contact",
            "category":"Anagrafica",
            "is_single_record_type":1,
        },
        {
            "object_name":"account",
            "record_type_name":"fornitore",
            "category":"Anagrafica",
            "is_single_record_type":0,
        },
        {
            "object_name":"product",
            "category":"Inventory",
            "is_single_record_type":1,
        },
    ]
    grouped_structure = group_object_definition_by_category(tables)
    assert grouped_structure == {
        "Anagrafica": [
            {
                "type": "group", 
                "label": "Account", 
                "children": [
                    {
                        "type": "leaf",
                        "object_name":"account",
                        "record_type_name":"cliente",
                        "category":"Anagrafica",
                        "is_single_record_type":0,
                    },
                    {
                        "type": "leaf",
                        "object_name":"account",
                        "record_type_name":"fornitore",
                        "category":"Anagrafica",
                        "is_single_record_type":0,
                    },
                ]
            },
            {
                "type": "leaf",
                "object_name":"contact",
                "category":"Anagrafica",
                "is_single_record_type":1,
            }
        ],
        "Inventory": [
            {
                "type": "leaf",
                "object_name":"product",
                "category":"Inventory",
                "is_single_record_type":1,
            }
        ]
    }

def test_get_fields_with_label():
    fields = [
        {
            "field_name":           "id",
            "field_type":           "auto_number",
        },
        {
            "field_name":           "full_name",
            "field_type":           "text",
        },
    ]
    new_fields = get_fields_with_label(fields)
    assert new_fields == [
        {
            "key":          "id",
            "label":        "id",
            "field_type":   "auto_number",
        },
        {
            "key":          "full_name",
            "label":        "full name",
            "field_type":   "text",
        },
    ]

def test_get_next_sort_order(cursor):
    command = """
    UPDATE record_layout_definition
    SET sort_order = 149
    WHERE object_name = 'contact' AND field_name = 'telefono';
    """
    cursor.execute(command)

    next_order = get_next_sort_order(cursor, "record_layout_definition", ["object_name = %s"], ["contact"])
    assert next_order == 150

def test_get_next_sort_order_no_matching_rows(cursor):
    next_order = get_next_sort_order(cursor, "record_layout_definition", ["object_name = %s"], ["new_object"])
    assert next_order == 1

def test_get_lookup_field_definition(cursor):
    fields = get_lookup_field_definition(
        cursor, 
        "field_definition", 
        ["object_name = %s", "field_type = %s",  "is_active = 1"], 
        ["contact", "lookup"]
    )
    assert fields == [
        {
            "field_name": "account"
        },
        {
            "field_name": "last_modified_by"
        },
    ]


