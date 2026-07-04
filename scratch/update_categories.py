import codecs

try:
    with codecs.open('backend/service/church/categories.js', 'r', encoding='utf-8') as f:
        text = f.read()

    # We want to replace requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']) 
    # with requireAccountingRole(['SYSTEM_ADMIN', 'FINANCE_CHAIR', 'FINANCE_MANAGER', 'DEPARTMENT_ACCOUNTANT', 'PASTOR'])
    # Let's see if it's there.
    
    old_role_str = "requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR'])"
    new_role_str = "requireAccountingRole(['SYSTEM_ADMIN', 'FINANCE_CHAIR', 'FINANCE_MANAGER', 'DEPARTMENT_ACCOUNTANT', 'PASTOR'])"
    
    if old_role_str in text:
        text = text.replace(old_role_str, new_role_str)
        with codecs.open('backend/service/church/categories.js', 'w', encoding='utf-8') as f:
            f.write(text)
        print("Categories permission updated successfully.")
    else:
        print("Warning: old_role_str not found in categories.js")

except Exception as e:
    print(f"Error: {e}")
