import logging
from core.log_manager import ContextFormatter

def test_format_appends_context():
    formatter = ContextFormatter("%(message)s")
    record = logging.makeLogRecord({"msg": "Record inserted", "context": {"user_id": 5, "record_id": "apple"}})
    result = formatter.format(record)                                 
    assert result == "Record inserted [user_id=5; record_id=apple]"

def test_format_without_context():
    formatter = ContextFormatter("%(message)s")
    record = logging.makeLogRecord({"msg": "Record inserted"})
    result = formatter.format(record)                                 
    assert result == "Record inserted"

def test_format_empty_context():
    formatter = ContextFormatter("%(message)s")
    record = logging.makeLogRecord({"msg": "Record inserted", "context":{}})
    result = formatter.format(record)                                 
    assert result == "Record inserted"