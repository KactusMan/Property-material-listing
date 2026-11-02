import app from './app.js';
import { connectDB } from './config/db.js';

// Not PORT: dev tooling often sets PORT for the Vite client, which proxies /api to this port.
const PORT = process.env.API_PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`)))
  .catch((error) => {
    console.error(`Server startup blocked: ${error.message}`);
    process.exit(1);
  });
