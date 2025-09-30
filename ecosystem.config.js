// ecosystem.config.cjs
module.exports = {
  apps: [
    // ===== Backend: Fastify =====
    {
      name: "qr-order-server",
      cwd: "./server",
      script: "npm",
      args: "run start",
      instances: "1",
      exec_mode: "cluster",
      autorestart: true,
      min_uptime: "30s",
      restart_delay: 2000,
      exp_backoff_restart_delay: 5000,
      max_memory_restart: "512M",
      // readiness & shutdown
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 8000,

      // logs
      out_file: "/var/log/qr-order/server/out.log",
      error_file: "/var/log/qr-order/server/error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },

    // ===== Frontend: Next.js =====
    {
      name: "qr-order-client",
      cwd: "./client",
      script: "npm",
      args: "run start",
      instances: "1",
      exec_mode: "cluster",
      autorestart: true,
      min_uptime: "30s",
      restart_delay: 2000,
      exp_backoff_restart_delay: 5000,
      max_memory_restart: "512M",

      out_file: "/var/log/qr-order/client/out.log",
      error_file: "/var/log/qr-order/client/error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
  ],
};
