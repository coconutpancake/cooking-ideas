module.exports = {
  apps: [
    {
      name: "cooking-ideas-api",
      cwd: __dirname,
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      out_file: "/var/log/cooking-ideas/api-out.log",
      error_file: "/var/log/cooking-ideas/api-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
