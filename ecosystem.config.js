module.exports = {
  apps: [
    {
      name: "gata-api-services",
      script: "ts-node -r tsconfig-paths/register src/server.ts",
      cwd: "/var/www/gata-api-services",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
