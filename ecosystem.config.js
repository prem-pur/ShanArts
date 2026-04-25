const path = require("path");

const root = __dirname;
const serverDir = path.join(root, "server");

module.exports = {
  apps: [
    {
      name: "ml-server",
      cwd: root,
      script: "python",
      args: "-m ml.model_server",
      autorestart: true,
      max_restarts: 10,
      env: {
        ML_HOST: "127.0.0.1",
        ML_PORT: "8000",
        ML_MODEL_PATH: "./ai-service/best_xgboost_delay_model.pkl",
        ML_TARGET_ENCODER_PATH: "./ai-service/label_encoder.pkl",
      },
      out_file: path.join(root, "logs", "ml-server.out.log"),
      error_file: path.join(root, "logs", "ml-server.err.log"),
      time: true,
    },
    {
      name: "node-app",
      cwd: serverDir,
      script: "index.js",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        ML_SERVER_URL: "http://127.0.0.1:8000",
        ML_TIMEOUT_MS: "5000",
      },
      // give ml-server time to boot
      wait_ready: false,
      listen_timeout: 15000,
      kill_timeout: 5000,
      out_file: path.join(root, "logs", "node-app.out.log"),
      error_file: path.join(root, "logs", "node-app.err.log"),
      time: true,
    },
  ],
};

