module.exports = {
  apps: [
    {
      name: 'qr-order-client',
      script: 'node_modules/next/dist/bin/next',
      args: '-p 4000',
      cwd: './client',
      instances: '2',
      exec_mode: 'cluster'
    }
  ]
}
