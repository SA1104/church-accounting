const { spawnSync } = require('child_process');
const fs = require('fs');

function runCommand(cmd, args, logFile) {
  console.log(`Running ${cmd} ${args.join(' ')}...`);
  const startTime = new Date();
  const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true });
  const endTime = new Date();
  
  const logContent = `Command: ${cmd} ${args.join(' ')}\nStarted: ${startTime.toISOString()}\nEnded: ${endTime.toISOString()}\nExit Code: ${res.status}\n\nSTDOUT:\n${res.stdout}\n\nSTDERR:\n${res.stderr}\n`;
  fs.writeFileSync(`database/verification/${logFile}`, logContent);
  
  let passed = res.status === 0;
  if (logContent.includes('FAIL') || logContent.includes('ERROR') || logContent.includes('Unhandled')) {
    passed = false;
  }
  
  console.log(`=> Exit Code: ${res.status}, Passed: ${passed}\n`);
  return { exitCode: passed ? 0 : 1 };
}

const stockTest = runCommand('npm', ['run', 'test:stock'], 'test_stock_log_v4_1.txt');
const lintTest = runCommand('npm', ['run', 'lint'], 'test_lint_log_v4_1.txt');
const buildTest = runCommand('npm', ['run', 'build'], 'test_build_log_v4_1.txt');

const manifestPath = 'database/verification/production_stock_instruments_payload_v4_1_manifest.json';
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.testExitCodes = {
    stock: stockTest.exitCode,
    lint: lintTest.exitCode,
    build: buildTest.exitCode
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

if (stockTest.exitCode !== 0 || lintTest.exitCode !== 0 || buildTest.exitCode !== 0) {
  process.exit(1);
} else {
  process.exit(0);
}
