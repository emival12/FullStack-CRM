import importlib.util
import os
import utils
import re
from types import SimpleNamespace
from decimal import Decimal
from dateutil import parser
import datetime

def run_triggers(cursor, triggers_dir, object_name, timing, event, record, throw_exception):
    query = """
        SELECT * 
        FROM trigger_definition 
        WHERE object_name = %s 
            AND trigger_timing = %s 
            AND trigger_event = %s 
            AND is_active = 1 
    """
    cursor.execute(query, (object_name, timing, event))
    active_triggers = cursor.fetchall()

    for trig in active_triggers:
        file_name = f"{object_name}_{timing}_{event}.py"
        file_path = os.path.join(triggers_dir, file_name)

        if os.path.exists(file_path):
            try:
                # Make the import of the file dynamically
                spec = importlib.util.spec_from_file_location("dynamic_trigger", file_path)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                result = module.execute(cursor, record)
                if result is not None:
                    record = result

            except Exception as e:
                throw_exception(f'Fatal error in the trigger {file_name}: {e}', throw_exc = True)
            
    return record

def process_system_formulas(cursor, object_name, record, complex_formula):
    query = """
        SELECT 
            field_name, 
            field_type,
            reference_object,
            formula_definition 
        FROM field_definition 
        WHERE 
            object_name = %s
    """
    cursor.execute(query, (object_name,))
    fields = cursor.fetchall()

    map_field_by_type = utils.get_field_divided_by_type(fields)
    formula_fields = map_field_by_type["formula_fields"]
    lookup_fields = map_field_by_type["picklist_lookup_fields"]


    lookup_complex_formula = {}
    for formula_data in complex_formula.values():
        for base_field in formula_data:
            lookup_complex_formula[base_field] = None

    for f in lookup_fields:
        field_name = f['field_name']
        if field_name in lookup_complex_formula:
            lookup_complex_formula[field_name] = f['reference_object']


    all_ref_objects = list(set(obj for obj in lookup_complex_formula.values() if obj))
    map_object_primary_key_names = utils.get_primary_keys_from_multiple_objects(cursor, all_ref_objects)
    for f in formula_fields:
        field_name = f['field_name']
        formula_definition = f['formula_definition']

        complex_data = {}
        if field_name in complex_formula:
            lookups_to_fetch = complex_formula.get(field_name)
            for base_field, field_set in lookups_to_fetch.items():
                related_id = record[base_field]
                ref_obj = lookup_complex_formula.get(base_field)

                related_record = utils.get_single_record(   
                    cursor,
                    ref_obj,
                    [{"field_name": fn} for fn in field_set],
                    [map_object_primary_key_names.get(ref_obj)],
                    [related_id]
                )
                complex_data[base_field] = related_record

        record = calculate_formula_field(cursor, record, field_name, formula_definition, complex_data)

    return record

def calculate_formula_field(cursor, record, field_name, formula_definition, complex_data):
    safe_methods = {
        "round": round,
        "abs": abs,
        "len": len,
        "max": max,
        "min": min,
        "str": str,
        "int": int,
        "decimal": Decimal
    }

    try:
        data_for_eval = {}
        for k, v in record.items():
            value = v
            if k in complex_data:
                value = complex_data.get(k)
                
            data_for_eval[k.lower()] = value


        ns = to_namespace(data_for_eval)
        context = {"field": ns, **safe_methods}
        
        clean_formula = formula_definition.replace("__obj", "")
        calculated_value = eval(clean_formula, {"__builtins__": None}, context)
        record[field_name] = calculated_value
    except Exception as e:
        print(f"Error in the formula {field_name}: {e}")
        record[field_name] = "ERROR"
    
    return record

def to_namespace(data):
    if isinstance(data, dict):
        return SimpleNamespace(**{k: to_namespace(v) for k, v in data.items()})
    else:
        return data


def get_record_for_processing(cursor, table_name, record_type_name, primary_key_field, record_id=None, record=None):
    fields = utils.get_record_layout_definition_fields(cursor, table_name, record_type_name)
    record = {k.lower(): v for k, v in record.items()} if record else {}

    map_field_by_type = utils.get_field_divided_by_type(fields)
    map_record_info_rollup_record = utils.get_rollup_definition(cursor, map_field_by_type["rollup_fields"])
    for row in fields:
        if row["field_type"] == utils.FieldTypes.ROLLUP.value:
            rollup_definition = map_record_info_rollup_record.get(utils.get_rollup_map_key(row)) 
            (fieldSyntax, join_clause) = utils.build_field_join_clause_aggregated(
                table_name,                                             # 
                rollup_definition["master_primary_key"],                # table_field
                row["reference_object"],                                # join_table_name
                rollup_definition["detail_join_key"],                   # join_field
                rollup_definition["aggregation_function"],              # aggregation_function
                rollup_definition["detail_field_name"],                 # detail_field
                rollup_definition["master_field_name"]                  # master_field
            )

            table_name_alias = utils.get_alias(table_name)
            query = f'''
            SELECT {fieldSyntax}
            FROM {table_name} {table_name_alias}
            {join_clause}
            WHERE {table_name_alias}.{primary_key_field} = %s
            '''
            cursor.execute(query, (record_id,))
            rollup_record = cursor.fetchone()
            record[row["field_name"]] = rollup_record[rollup_definition["master_field_name"]]

    map_field_to_retrieve = set()
    fields_to_retrieve = []
    for row in fields:
        if row["field_type"] != utils.FieldTypes.FORMULA.value:
            fields_to_retrieve.append(row)
            map_field_to_retrieve.add(row["field_name"].lower())

    complex_formula = get_fields_from_formulas(
        map_field_by_type.get("formula_fields", []), 
        lambda field_name: field_name.lower(),
        lambda field_name: {"field_name": field_name}, 
        map_field_to_retrieve, 
        fields_to_retrieve
    )
  
    if record_id:
        db_data = utils.get_single_record(cursor, table_name, fields_to_retrieve, [primary_key_field], [record_id])
        db_data.update(record)
        record = db_data

    record = cast_record_types(record, fields)
    return record, complex_formula

def get_fields_from_formulas(map_formula_fields, transform_field_key, transform_field_name, already_extracted_field, return_field_list):
    regex = "field\.([A-Za-z0-9_]+__obj\.[A-Za-z0-9_]+|[A-Za-z0-9_]+)"

    complex_formula = {}
    for field in map_formula_fields:
        matched_fields = re.findall(regex, field["formula_definition"])
        for mf in matched_fields:
            if '.' in mf:
                split = mf.split(".")
                base_field = split[0][:-5]

                target_formula = complex_formula.setdefault(field["field_name"], {})
                target_lookup = target_formula.setdefault(base_field, set())
                target_lookup.add(split[1])
            else:
                base_field = mf
            f_key = transform_field_key(base_field)
            if f_key not in already_extracted_field:
                f = transform_field_name(mf)
                return_field_list.append(f)
                already_extracted_field.add(f_key)
    
    return complex_formula

def cast_record_types(record, fields_definition):
    type_map = {f['field_name']: f['field_type'] for f in fields_definition}

    for key, value in record.items():
        f_type = type_map.get(key)
        if f_type in (utils.FieldTypes.NUMBER.value, utils.FieldTypes.ROLLUP.value):
            record[key] = Decimal(value or 0)            
        elif f_type in (utils.FieldTypes.DATE.value, utils.FieldTypes.DATE_TIME.value):
            if isinstance(value, str):
                record[key] = parser.parse(value)

    return record


