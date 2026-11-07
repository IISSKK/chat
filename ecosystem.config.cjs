module.exports = {
  apps: [
    {
      name: "barakat",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      exec_mode: "cluster",
      instances: 2,
      max_memory_restart: "700M",
      env: { NODE_ENV: "production", NODE_OPTIONS: "--disable-warning=ExperimentalWarning" },
    },
  ],
};
