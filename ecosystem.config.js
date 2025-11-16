module.exports = {
  apps: [
    {
      name: "gata-api-services",
      script: "node -r tsconfig-paths/register dist/server.js",
      cwd: "/var/www/gata-api-services",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--require tsconfig-paths/register",
      },
    },
  ],
};
