// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'qr-order-server',
      script: 'npm',
      args: 'run start',
      instances: '2',
      exec_mode: 'cluster',

      out_file: './logs/server-out.log',
      error_file: './logs/server-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
}
