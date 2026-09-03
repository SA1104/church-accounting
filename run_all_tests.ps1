
$ErrorActionPreference = "Stop"
try {
    cd backend
    Write-Host "--- TEST:AUTH ---"
    npm run test:auth
    Write-Host "--- TEST:STOCK ---"
    npm run test:stock
    Write-Host "--- TEST:CONTRACTS ---"
    npm run test:contracts
    Write-Host "--- TEST:CHURCH_AUTH ---"
    npm run test:church
    
    cd ../frontend
    Write-Host "--- FRONTEND:LINT ---"
    npm run lint
    Write-Host "--- FRONTEND:BUILD ---"
    npm run build
    
    Write-Host "ALL_PASSED_SUCCESSFULLY"
} catch {
    Write-Host "TEST FAILED"
    exit 1
}

