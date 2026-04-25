const path = require("path");

const root = __dirname;
const serverDir = path.join(root, "server");

module.exports = {
  apps: [
    {
      name: "ml-server",
      cwd: root,
      script: "python",
      args: "-m uvicorn ml.model_server:app --host 127.0.0.1 --port 8000",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        ML_MODEL_PATH: "./ml/saved_model/best_xgboost_delay_model.pkl",
        ML_LABEL_ENCODER_PATH: "./ml/saved_model/label_encoder.pkl",
        ML_FEATURE_ENGINEER_PATH: "./ml/saved_model/feature_engineer.pkl",
        ML_PREPROCESSOR_PATH: "./ml/saved_model/preprocessor.pkl",
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
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        ML_SERVER_URL: "http://127.0.0.1:8000",
        ML_TIMEOUT_MS: "5000",
      },
      out_file: path.join(root, "logs", "node-app.out.log"),
      error_file: path.join(root, "logs", "node-app.err.log"),
      time: true,
    },
  ],
};

