import sqlite3
import os

for db_path in ['backend/church.db', 'backend/service/church/db.sqlite']:
    print('DB Path:', db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print('Tables:')
    for t in tables:
        print(' -', t[0])
    print('='*20)
