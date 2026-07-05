import sqlite3

conn = sqlite3.connect('backend/church.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cursor.fetchall()]

for table in ['account_categories', 'church_account_categories']:
    if table in tables:
        print('Table:', table)
        cursor.execute(f"PRAGMA table_info({table})")
        cols = cursor.fetchall()
        for col in cols:
            print(' -', col[1], col[2])
