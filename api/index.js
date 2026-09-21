// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json)
// and handled by the same Express app used for local development.
import app from "../backend/server.js";

export default app;
