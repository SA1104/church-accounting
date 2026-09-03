const fs = require("fs");
const { execSync } = require("child_process");

const authFile = "backend/core/auth/index.js";
const authOrig = fs.readFileSync(authFile, "utf8");
const serverFile = "backend/server.js";
const serverOrig = fs.readFileSync(serverFile, "utf8");

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

console.log("--- Auth Mutations ---");
testMutation(authFile, authOrig, authOrig.replace("await authClient.resend", "// await authClient.resend"), "npm run test:auth", "1. auth.resend 호출 제거");
testMutation(authFile, authOrig, authOrig.replace("await authClient.resend({", "await authClient.resend({type:'signup',email:normalizedEmail}); await authClient.resend({"), "npm run test:auth", "2. auth.resend 두 번 호출");
testMutation(authFile, authOrig, authOrig.replace("const cleanEmail = email.trim().toLowerCase();", "const cleanEmail = email.toLowerCase();"), "npm run test:auth", "3. trim 제거");
testMutation(authFile, authOrig, authOrig.replace("const cleanEmail = email.trim().toLowerCase();", "const cleanEmail = email.trim();"), "npm run test:auth", "4. lowercase 제거");
testMutation(authFile, authOrig, authOrig.replace("options: {", "options: { emailRedirectTo: 'http://malicious.com', "), "npm run test:auth", "5. emailRedirectTo 임의 조작");
testMutation(authFile, authOrig, authOrig.replace("url.hostname === 'localhost'", "false"), "npm run test:auth", "6. Production localhost 허용");
testMutation(serverFile, serverOrig, serverOrig.replace("status: 429", "status: 200"), "npm run test:auth", "7. Supabase 429 매핑 변경");
testMutation(serverFile, serverOrig, serverOrig.replace("status: 500", "status: 200"), "npm run test:auth", "8. Supabase 5xx 매핑 변경");
testMutation(serverFile, serverOrig, serverOrig.replace("resendConfirmationLimiter,", ""), "npm run test:auth", "9. Rate Limiter 제거");
testMutation(authFile, authOrig, authOrig.replace("'*'.repeat(Math.max(1, Math.min(b.length, 5)))", "b"), "npm run test:auth", "10. 마스킹 제거");
testMutation(serverFile, serverOrig, serverOrig.replace("process.env.NODE_ENV === 'test'", "true"), "npm run test:auth", "11. Mock 상시 활성화");

console.log(`AUTH MUTATIONS DETECTED: ${detected}/${total}`);
