const { spawn } = require('child_process');
const electronBinary = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, ['.'], {
  stdio: 'inherit',
  env,
  windowsHide: false
});

child.on('close', (code, signal) => {
  if (signal) {
    process.exitCode = 1;
    console.error(`Electron process terminated with signal ${signal}`);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Failed to start Electron:', error);
  process.exit(1);
});


