from __future__ import annotations
import re
import logging
from types import SimpleNamespace
from simpleeval import SimpleEval
from decimal import Decimal
from dateutil import parser
from core.models import FieldTypes, SystemFieldName_FD
from core.exceptions import raise_server_exception, raise_input_exception, log_event, ExceptionKind
from db.db_queries import (
    get_field_divided_by_type,
    get_primary_keys_from_multiple_objects,
    get_single_record,
)

logger = logging.getLogger(__name__) 

# Suffix used in formula syntax to reference lookup fields ex: "cliente__obj.nome", "__obj" marks a cross-object field reference
_LOOKUP_SUFFIX = "__obj"
_LOOKUP_SUFFIX_LEN = len(_LOOKUP_SUFFIX)
_LOOKUP_SUFFIX_RE = re.compile(re.escape(_LOOKUP_SUFFIX))


def is_not_blank(value) -> bool:
    # 0 and False are valid values for numeric/checkbox fields explicitly check for None to avoid treating zero as blank
    if value is None:
        return False
    if isinstance(value, str):
        return value != '' and value != 'NULL'
    return True

def extract_formula_dependencies(formula_fields: list[dict], already_extracted_fields: set, return_field_list: list) -> dict:
    """
        Parses formula definitions and extracts field dependencies.

        Scans each formula for `field.<name>` and `field.<lookup>__obj.<subfield>` references.
        Simple field references are added to return_field_list if not already tracked.
        Lookup-based references are collected into a complex_formula map for later data fetching.

        Args:
            formula_fields (list[dict]): Formula field rows from field_definition
            already_extracted_fields (set): Field names already scheduled for retrieval (mutated in place)
            return_field_list (list): List of field dicts to retrieve from DB (mutated in place)

        Returns:
            dict: Mapping of formula_field_name → {base_lookup_field → set of subfields}
    """
    # Matches both simple fields (field.name) and lookup references (field.lookup__obj.subfield)
    regex = r"field\.([A-Za-z0-9_]+__obj\.[A-Za-z0-9_]+|[A-Za-z0-9_]+)"

    complex_formula = {}
    for formula_field in formula_fields:
        formula_definition = formula_field[SystemFieldName_FD.FORMULA_DEFINITION]
        if not formula_definition:
            continue

        for mf in re.findall(regex, formula_definition):
            if _LOOKUP_SUFFIX in mf:
                # Lookup reference: split into the lookup token and the subfield on the related object
                raw_lookup_token, subfield = mf.split('.')             # e.g. "cliente__obj", "nome"
                base_field = raw_lookup_token[:-_LOOKUP_SUFFIX_LEN]    # "cliente"

                # Register the subfield under this formula's lookup dependency map
                target_formula = complex_formula.setdefault(formula_field[SystemFieldName_FD.FIELD_NAME], {})
                target_formula.setdefault(base_field, set()).add(subfield)
            else:
                # Simple field reference: the match is the field name directly
                base_field = mf

            # Track base_field for retrieval from DB, deduplicating across formulas
            f_key = base_field.lower()
            if f_key not in already_extracted_fields:
                return_field_list.append({SystemFieldName_FD.FIELD_NAME: base_field})
                already_extracted_fields.add(f_key)

    return complex_formula

def cast_record_types(record: dict, fields_definition: list[dict]) -> dict:
    """
        Casts number, rollup, and date field values to their correct Python types.

        Mutates and returns the record dict in-place.
        - NUMBER / ROLLUP: blank/NULL → Decimal(0). Non-numeric strings raise a server exception.
        - DATE / DATE_TIME: blank/NULL/non-string → skipped. Unparseable strings raise a server exception.

        Args:
            record (dict): The record to cast (mutated in-place).
            fields_definition (list[dict]): Field metadata rows from field_definition.

        Returns:
            dict: The same record with values cast to their correct types.
    """
    # Build a field_name → field_type lookup to avoid repeated scans of fields_definition
    type_map = {f[SystemFieldName_FD.FIELD_NAME]: f[SystemFieldName_FD.FIELD_TYPE] for f in fields_definition}

    for key, value in record.items():
        f_type = type_map.get(key)
        if f_type in (FieldTypes.NUMBER.value, FieldTypes.ROLLUP.value):
            # Blank and NULL are valid states for an empty numeric field
            if not value or value == 'NULL':
                record[key] = Decimal(0)
            else:
                try:
                    record[key] = Decimal(value)
                except Exception:
                    raise_server_exception(logger, "Cast failed", key=key, value=value, type=f_type)

        elif f_type in (FieldTypes.DATE.value, FieldTypes.DATE_TIME.value):
            # Skip non-strings and blank/NULL values (optional date field)
            if isinstance(value, str) and value and value != 'NULL':
                try:
                    record[key] = parser.parse(value)
                except Exception:
                    raise_server_exception(logger, "Cast failed", key=key, value=value, type=f_type)

    return record

def to_namespace(data):
    if isinstance(data, dict):
        return SimpleNamespace(**{k: to_namespace(v) for k, v in data.items()})
    else:
        return data
        
def evaluate_formula(record: dict, field_name: str, formula_definition: str, complex_data: dict) -> dict:
    """
        Evaluates a single formula field and writes the result into the record.

        Uses simpleeval (AST-whitelist evaluator) to prevent arbitrary code execution: the formula
        is parsed into an AST and only whitelisted node types, functions, and attribute names are
        allowed. Attribute access on underscore-prefixed names is rejected, blocking the classic
        `().__class__.__bases__[0].__subclasses__()` escape.
        On any evaluation error, logs the technical detail and raises a 422 with error code
        BROKEN_FORMULA so the UI can surface which formula is broken.

        Args:
            record (dict): The current record being processed
            field_name (str): Name of the formula field to populate
            formula_definition (str): The formula expression string
            complex_data (dict): Pre-fetched lookup record data keyed by base field name

        Returns:
            dict: The record with the formula field value set
    """
    safe_methods = {
        "round": round,
        "abs": abs,
        "len": len,
        "max": max,
        "min": min,
        "str": str,
        "int": int,
        "decimal": Decimal,
        "is_not_blank": is_not_blank,
    }

    # Strip __obj suffix so the formula expression matches the namespace attribute names
    clean_formula = _LOOKUP_SUFFIX_RE.sub("", formula_definition)
    try:
        data_for_eval = {}
        for k, v in record.items():
            value = complex_data.get(k) if k in complex_data else v
            data_for_eval[k.lower()] = value

        ns = to_namespace(data_for_eval)
        evaluator = SimpleEval(functions=safe_methods, names={"field": ns})
        record[field_name] = evaluator.eval(clean_formula)
    except Exception:
        log_event(logging.ERROR, logger, "Fatal error on formula calculation", exc_info=True, field_name=field_name, formula_definition=formula_definition, clean_formula=clean_formula)
        raise_input_exception(422, "BROKEN_FORMULA", {"field_name": field_name}, kind=ExceptionKind.BUSINESS_SHARED)

    return record

def _sort_formula_fields_topologically(formula_fields: list[dict]) -> list[dict]:
    """
        Sort formula fields in dependency order so that if formula A references formula B, B is evaluated first.
        Falls back to the original order if a circular dependency is detected.
    """
    formula_name_set = {f[SystemFieldName_FD.FIELD_NAME].lower() for f in formula_fields}
    field_map        = {f[SystemFieldName_FD.FIELD_NAME].lower(): f for f in formula_fields}

    # Build the direct dependency map: for each formula, which OTHER formula fields does it reference?
    # e.g. A references B, C → deps["A"] = {B, C}
    ref_re = re.compile(r"field\.([A-Za-z0-9_]+)")
    deps = {}
    for f in formula_fields:
        name = f[SystemFieldName_FD.FIELD_NAME].lower()
        formula_def = f[SystemFieldName_FD.FORMULA_DEFINITION] or ""
        # Keep only references to other formula fields (non-formula fields don't affect eval order)
        deps[name] = {m.lower() for m in ref_re.findall(formula_def) if m.lower() in formula_name_set and m.lower() != name}

    # Build the reverse map: for each formula, who depends on it?
    # This is used during the sort to know which nodes to unblock after processing a node.
    # e.g. dependents[B] = [A]
    dependents = {name: [] for name in formula_name_set}
    for name, formula_deps in deps.items():
        for dep in formula_deps:
            dependents[dep].append(name)

    # Kahn's algorithm: repeatedly emit nodes whose dependencies are all satisfied
    # in_degree[A] = number of formula fields that A still needs to wait for
    in_degree = {name: len(d) for name, d in deps.items()}
    queue = [name for name in formula_name_set if in_degree[name] == 0]  # start with fields that have no formula dependencies
    
    sorted_names = []
    while queue:
        node = queue.pop(0)
        sorted_names.append(node)
        for dependent in dependents[node]:
            in_degree[dependent] -= 1       # one dependency of this node is now resolved
            if in_degree[dependent] == 0:   # all dependencies resolved: ready to evaluate
                queue.append(dependent)

    if len(sorted_names) != len(formula_name_set):
        log_event(logging.WARNING, logger, "Formulas has circular dependencies")
        return formula_fields  # circular dependency — fall back to original order

    return [field_map[name] for name in sorted_names]

def evaluate_all_formulas(cursor, fields: dict[str, list[dict]], record: dict, complex_formula: dict) -> dict:
    """
        Evaluates all formula fields for a record, including those referencing lookup data.

        For each formula field that has lookup dependencies (complex_formula), fetches the
        related record from DB before evaluating. Simple formula fields are evaluated directly.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            fields (list[dict]): All active field definitions for the object and record type.
            record (dict): The current record being processed.
            complex_formula (dict): Lookup dependency map returned by extract_formula_dependencies.

        Returns:
            dict: The record with all formula fields populated.
    """

    map_field_by_type = get_field_divided_by_type(fields)
    formula_fields = _sort_formula_fields_topologically(map_field_by_type.formula_fields)
    lookup_fields = map_field_by_type.picklist_lookup_fields

    # Build a map {base_field → reference_object} for every lookup used by any formula.
    # First pass: collect all base_fields referenced in complex_formula, with no ref yet
    lookup_complex_formula = {}
    for formula_data in complex_formula.values():
        for base_field in formula_data:
            lookup_complex_formula[base_field] = None

    # Second pass: fill in the reference_object from the actual lookup field definitions
    for f in lookup_fields:
        field_name = f[SystemFieldName_FD.FIELD_NAME]
        if field_name in lookup_complex_formula:
            lookup_complex_formula[field_name] = f[SystemFieldName_FD.REFERENCE_OBJECT]

    # Fetch the primary key name for each referenced object in a single batch query
    all_ref_objects = list(set(obj for obj in lookup_complex_formula.values() if obj))
    map_object_primary_key_names = get_primary_keys_from_multiple_objects(cursor, all_ref_objects)

    # Pre-merge all subfields needed per base_field across ALL formulas.
    # This ensures the cache always contains every subfield any formula might need, regardless of which formula triggers the fetch first.
    all_subfields_per_base = {}
    for formula_data in complex_formula.values():
        for base_field, field_set in formula_data.items():
            all_subfields_per_base.setdefault(base_field, set()).update(field_set)

    # Cache related records by (ref_obj, related_id) to avoid duplicate queries across formulas
    lookup_cache = {}
    for f in formula_fields:
        field_name = f[SystemFieldName_FD.FIELD_NAME]
        formula_definition = f[SystemFieldName_FD.FORMULA_DEFINITION]

        if not formula_definition:
            continue

        # complex_data holds the pre-fetched related records needed by this specific formula
        complex_data = {}
        if field_name in complex_formula:
            lookups_to_fetch = complex_formula.get(field_name)
            for base_field in lookups_to_fetch:
                # base_field is the FK field on the current record (e.g. "cliente_id")
                related_id = record.get(base_field)
                if is_not_blank(related_id):
                    ref_obj = lookup_complex_formula.get(base_field)
                    if not ref_obj:
                        raise_server_exception(logger, "No reference_object resolved", field_name=base_field)

                    pk_field = map_object_primary_key_names.get(ref_obj)
                    if not pk_field:
                        raise_server_exception(logger, "No primary_key resolved", object_name=ref_obj)

                    # Fetch all subfields any formula needs for this lookup in one query
                    cache_key = (ref_obj, str(related_id))
                    if cache_key not in lookup_cache:
                        lookup_cache[cache_key] = get_single_record(
                            cursor,
                            ref_obj,
                            [{"field_name": fn} for fn in all_subfields_per_base[base_field]],
                            [f"{pk_field} = %s"],
                            [related_id]
                        )
                    complex_data[base_field] = lookup_cache[cache_key]

        record = evaluate_formula(record, field_name, formula_definition, complex_data)

    return record
