console.log('env run as node', process.env.ELECTRON_RUN_AS_NODE);
console.log('versions', process.versions);
const electronMain = require('electron/main');
console.log(Object.keys(electronMain));
