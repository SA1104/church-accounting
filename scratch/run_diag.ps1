$nodePath = "C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\tools\node"
$env:PATH = "$nodePath;$env:PATH"
Copy-Item scratch\test_db_diagnostic2.js backend\test_db_diagnostic2.js
cd backend
node test_db_diagnostic2.js
Remove-Item test_db_diagnostic2.js
