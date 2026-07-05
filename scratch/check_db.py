import sqlite3
import os

db_path = 'backend/db.sqlite'
if not os.path.exists(db_path):
    # Try finding it in backend/service/church/
    db_path = 'backend/service/church/db.sqlite'

print('DB Path:', db_path)
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('Tables:')
for t in tables:
    print(' -', t[0])
