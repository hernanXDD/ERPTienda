const path = require('path');

const directorioBackend = path.join(__dirname, '..', 'backend');

/** PM2 — API en el VPS (2 GB RAM: una sola instancia, tope de memoria). */
module.exports = {
  apps: [
    {
      name: 'erp-tienda-api',
      cwd: directorioBackend,
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '450M',
      node_args: '--max-old-space-size=384',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
