const DEFAULT_PORT =
  // Your backend .env uses 5001 by default in this repo.
  "5001";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  `http://${window.location.hostname}:${DEFAULT_PORT}`;

