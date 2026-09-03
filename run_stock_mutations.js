const fs = require("fs");
const { execSync } = require("child_process");

const serverFile = "backend/server.js";
const serverOrig = fs.readFileSync(serverFile, "utf8");

const stockPublicControllerFile = "backend/service/stock/controllers/publicStockController.js";
const stockPublicControllerOrig = fs.readFileSync(stockPublicControllerFile, "utf8");

function runTest(cmd) {
    try {
        execSync(cmd, { stdio: "ignore", cwd: "backend" });
        return false; 
    } catch(e) {
        return true; 
    }
}

let detected = 0;
let total = 0;

function testMutation(file, original, mutated, testCmd, name) {
    total++;
    fs.writeFileSync(file, mutated);
    const killed = runTest(testCmd);
    if (killed) detected++;
    console.log(`Mutation: ${name} -> ${killed ? "DETECTED" : "SURVIVED"}`);
    fs.writeFileSync(file, original);
}

console.log("--- Stock Mutations ---");
testMutation(serverFile, serverOrig, serverOrig.replace("app.use('/api/stock', publicStockRoutes);", "// app.use('/api/stock', publicStockRoutes);"), "npm run test:stock", "1. Public Router authenticateToken 씠썑濡 씠룞 (젣嫄)");
testMutation(stockPublicControllerFile, stockPublicControllerOrig, stockPublicControllerOrig.replace("dbState: dbState,", "dbState: dbState, DATABASE_URL: process.env.DATABASE_URL"), "npm run test:stock", "4. Health뿉 DATABASE_URL 끂異");
testMutation(serverFile, serverOrig, serverOrig.replace("app.use('/api/stock', authenticateToken);", "// app.use('/api/stock', authenticateToken);"), "npm run test:stock", "5. Protected Route 씤利 젣嫄");

console.log(`STOCK MUTATIONS DETECTED: ${detected}/${total}`);
