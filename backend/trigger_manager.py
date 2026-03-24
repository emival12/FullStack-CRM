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

def process_system_formulas(cursor, object_name, record):
    query = """
        SELECT 
            field_name, 
            formula_definition 
        FROM field_definition 
        WHERE 
            object_name = %s 
            AND field_type = %s
    """
    cursor.execute(query, (object_name, utils.FieldTypes.FORMULA.value))
    formula_fields = cursor.fetchall()

    for f in formula_fields:
        field_name = f['field_name']
        formula_definition = f['formula_definition']
        
        record = calculate_formula_field(record, field_name, formula_definition)
    
    return record

def calculate_formula_field(record, field_name, formula_definition):
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
        data_for_eval = {k.lower(): v for k, v in record.items()}
        ns = SimpleNamespace(**data_for_eval)
        context = {"field": ns, **safe_methods}
        
        calculated_value = eval(formula_definition, {"__builtins__": None}, context)
        record[field_name] = calculated_value
    except Exception as e:
        print(f"Error in the formula {field_name}: {e}")
        record[field_name] = "ERROR"
    

    return record

def get_record_for_processing(cursor, table_name, record_type_name, primary_key_field=None, record_id=None, record=None):
    fields = utils.get_record_layout_definition_fields(cursor, table_name, record_type_name)
    record = {k.lower(): v for k, v in record.items()} if record else {}

    if record_id and primary_key_field:
        map_field_by_type = utils.get_field_divided_by_type(fields)
        map_field_to_retrieve = set()
        fields_to_retrieve = []
        
        for row in fields:
            if row["field_type"] != utils.FieldTypes.FORMULA.value:
                fields_to_retrieve.append(row)
                map_field_to_retrieve.add(row["field_name"].lower())

        get_fields_from_formulas(
            map_field_by_type.get("formula_fields", []), 
            lambda field_name: field_name.lower(),
            lambda field_name: {"field_name": field_name}, 
            map_field_to_retrieve, 
            fields_to_retrieve
        )

        db_data = utils.get_single_record(cursor, table_name, fields_to_retrieve, [primary_key_field], [record_id])
        db_data.update(record)
        record = db_data

    record = cast_record_types(record, fields)
    return record

def get_fields_from_formulas(map_formula_fields, transform_field_key, transform_field_name, already_extracted_field, return_field_list):
    regex = "field\.([A-Za-z0-9_]*)"

    for field in map_formula_fields:
        matched_fields = re.findall(regex, field["formula_definition"])
        for mf in matched_fields:
            f_key = transform_field_key(mf)
            if f_key not in already_extracted_field:
                f = transform_field_name(mf)
                return_field_list.append(f)
                already_extracted_field.add(f)
    
    return return_field_list, already_extracted_field

def cast_record_types(record, fields_definition):
    type_map = {f['field_name']: f['field_type'] for f in fields_definition}

    for key, value in record.items():
        f_type = type_map.get(key)
        if f_type == utils.FieldTypes.NUMBER.value:
            record[key] = Decimal(value or 0)            
        elif f_type in (utils.FieldTypes.DATE.value, utils.FieldTypes.DATE_TIME.value):
            if isinstance(value, str):
                record[key] = parser.parse(value)

    return record


