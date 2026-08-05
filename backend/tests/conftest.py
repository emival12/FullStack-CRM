import mysql.connector
import pytest
from config import get_config

@pytest.fixture(scope="session")
def db():
    """
        Session-wide connection to the dedicated test database.
        Credentials are read from [database], but the target schema comes from [test-database] and is rejected unless its name contains "test"
    """

    config = get_config()
    db_name = config["test-database"]["database"]
    if not db_name or "test" not in db_name.lower():
        msg = f"Invalid test database {db_name!r} in [test-database] of config.ini: the test suite only runs against a schema whose name contains 'test'"
        pytest.fail(msg, pytrace=False)

    conn = mysql.connector.connect(
        host="localhost",
        user=config["database"]["user"],
        password=config["database"]["password"],
        database=db_name
    )
    yield conn
    conn.close()

@pytest.fixture
def cursor(db):
    """Function-scoped dictionary cursor. Read-only tests: rollback, never commit."""

    cursor = db.cursor(dictionary=True)
    yield cursor
    db.rollback()
    cursor.close()