module.exports = {
  apps: [
    {
      name: "api-services",
      script: "dist/index.js",     // hasil build TS ke JS
      cwd: "/var/www/gata-api-services",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
