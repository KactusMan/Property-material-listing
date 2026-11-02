import mongoose from 'mongoose';
import dns from 'node:dns';

// Some Windows resolvers refuse SRV lookups; use public DNS for local development only.
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Keep the system resolver if the override is rejected.
  }
}

// Request input reaches queries only after server/lib/http.js coerces it to plain strings and
// numbers, so operator objects such as { "$ne": null } never get through.
mongoose.set('strictQuery', true);

let pending = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set.');
  }
  if (!pending) {
    pending = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then((conn) => conn.connection)
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
};
