// Empty by default: the app calls /api on its own origin.
// On Vercel that is the serverless backend; locally Vite proxies /api to port 5000.
export const API_URL = import.meta.env.VITE_API_URL || "";
