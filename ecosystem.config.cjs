// PM2 Ecosystem Configuration for mikromatter
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "mikromatter",
      script: "dist/index.js",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      env_file: ".env",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};

