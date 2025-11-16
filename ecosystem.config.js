module.exports = {
  apps: [
    {
      name: "gata-api-services",
<<<<<<< HEAD
      script: "./start.js",
=======
      script: "ts-node -r tsconfig-paths/register src/server.ts",
>>>>>>> 5e497b40a2205b271195a0da815e120591749980
      cwd: "/var/www/gata-api-services",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
