from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum, auto

MASTER_RECORD_TYPE = "master"

class FieldTypes(Enum):
    TEXT        = "text"
    NUMBER      = "number"
    LOOKUP      = "lookup"
    PICKLIST    = "picklist"
    ROLLUP      = "rollup"
    RADIO       = "radio"
    CHECKBOX    = "checkbox"
    DATE        = "date"
    DATE_TIME   = "datetime-local"
    IMG         = "image"
    AUTO_NUMBER = "auto_number"
    FORMULA     = "formula"

@dataclass
class FieldsByType:
    """
        Typed container returned by get_field_divided_by_type().
        Groups field metadata dictionaries by field type for efficient downstream access.
    """
    radio_fields:           list[dict] = field(default_factory=list)
    picklist_lookup_fields: list[dict] = field(default_factory=list)
    rollup_fields:          list[dict] = field(default_factory=list)
    formula_fields:         list[dict] = field(default_factory=list)

class FieldStructureMode(Enum):
    STRUCTURE_ONLY     = auto()
    STRUCTURE_AND_DATA = auto()

class RldFilterConditions(Enum):
    VISIBLE                  = auto()
    VISIBLE_AND_EDITABLE     = auto()


class SystemObjects(str, Enum):
    """
        String constants for built-in system object names.
        These objects are platform-managed and have restricted CRUD behaviour.
        This class is not meant to be instantiated.
    """
    USER_DEFINITION          = "user_definition"
    USER_PROFILE_DEFINITION  = "user_profile_definition"
    OBJECT_DEFINITION        = "object_definition"
    RECORD_TYPE_DEFINITION   = "record_type_definition"
    FIELD_DEFINITION         = "field_definition"
    LIST_VIEW_DEFINITION     = "list_view_definition"
    RECORD_LAYOUT_DEFINITION = "record_layout_definition"
    RELATED_LIST_DEFINITION  = "related_list_definition"
    RADIO_CHECKBOX_OPTIONS   = "radio_checkbox_options"
    AGGREGATION_FUNCTION     = "aggregation_function"
    ROLLUP_DEFINITION        = "rollup_definition"

class StandardObjectField:
    """
        String constants for standard fields automatically added to every CRM object on creation.
        These fields are managed by the platform and are not user-defined.
        This class is not meant to be instantiated.
    """
    RECORD_TYPE_NAME   = "record_type_name"
    CREATE_DATE        = "create_date"
    LAST_MODIFIED_DATE = "last_modified_date"
    LAST_MODIFIED_BY   = "last_modified_by"

class SystemFieldName_FD:
    """
    String constants for column names of the field_definition System Table 
    Use these when accessing row dictionaries returned by system table queries.
    This class is not meant to be instantiated.
    """
    OBJECT_NAME         = "object_name"
    RECORD_TYPE_NAME    = "record_type_name"
    FIELD_NAME          = "field_name"
    FIELD_TYPE          = "field_type"
    LENGHT              = "length"
    NUMERIC_PRECISION   = "numeric_precision"
    NUMERIC_SCALE       = "numeric_scale"
    REFERENCE_OBJECT    = "reference_object"
    REFERENCE_FIELD     = "reference_field"
    LOOKUP_FILTER       = "lookup_filter"
    FORMULA_DEFINITION  = "formula_definition"
    IS_ACTIVE           = "is_active"
    IS_VISIBLE          = "is_visible"
    IS_EDITABLE         = "is_editable"
    IS_REQUIRED         = "is_required"
    IS_PRIMARY_KEY      = "is_primary_key"

class SystemFieldName_OD:
    """
    String constants for column names of the object_definition System Table 
    Use these when accessing row dictionaries returned by system table queries.
    This class is not meant to be instantiated.
    """
    OBJECT_NAME             = "object_name"
    OBJECT_LABEL            = "object_label"
    CATEGORY                = "category"
    IS_SINGLE_RECORD_TYPE   = "is_single_record_type"

class SystemFieldName_RTD:
    """
    String constants for column names of the record_type_definition System Table 
    Use these when accessing row dictionaries returned by system table queries.
    This class is not meant to be instantiated.
    """
    RECORD_TYPE_NAME        = "record_type_name"

class SystemFieldName_ROLLD:
    """
    String constants for column names of the rollup_definition System Table 
    Use these when accessing row dictionaries returned by system table queries.
    This class is not meant to be instantiated.
    """
    MASTER_OBJECT_NAME      = "master_object_name"
    MASTER_RECORD_TYPE_NAME = "master_record_type_name"
    MASTER_PRIMARY_KEY      = "master_primary_key"
    MASTER_FIELD_NAME       = "master_field_name"
    DETAIL_OBJECT_NAME      = "detail_object_name"
    DETAIL_JOIN_KEY         = "detail_join_key"
    DETAIL_FIELD_NAME       = "detail_field_name"
    AGGREGATION_FUNCTION    = "aggregation_function"
    FILTER_CONDITION        = "filter_condition"

class SystemFieldName_RLD:
    """
    String constants for column names of the related_list_definition System Table
    Use these when accessing row dictionaries returned by system table queries.
    This class is not meant to be instantiated.
    """
    MASTER_OBJECT_NAME      = "master_object_name"
    MASTER_RECORD_TYPE_NAME = "master_record_type_name"
    MASTER_PRIMARY_KEY      = "master_primary_key"
    CHILD_OBJECT_NAME       = "child_object_name"
    CHILD_RECORD_TYPE_NAME  = "child_record_type_name"
    CHILD_JOIN_KEY          = "child_join_key"
    LABEL                   = "label"
    SORT_ORDER              = "sort_order"
    FILTER_CONDITION        = "filter_condition"

class SystemFieldName_UD:
    """
    String constants for column names of the user_definition System Table
    Use these when accessing row dictionaries returned by system table queries.
    This class is not meant to be instantiated.
    """
    EMAIL       = "email"
    PASSWORD    = "password"
    IS_ACTIVE   = "is_active"

    