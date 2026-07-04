import sqlite3

try:
    conn = sqlite3.connect('church.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(platform_role_assignments)")
    rows = cursor.fetchall()
    print('table_info:', rows)

    cursor.execute("PRAGMA index_list(platform_role_assignments)")
    rows = cursor.fetchall()
    print('index_list:', rows)
    for r in rows:
        cursor.execute(f"PRAGMA index_info({r[1]})")
        print(f"index {r[1]}:", cursor.fetchall())

except Exception as e:
    print(e)
