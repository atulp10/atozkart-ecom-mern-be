import mongoose from 'mongoose';
import { getConfig } from './env.js';

let connectionPromise;

export function connectDatabase() {
  if (!connectionPromise) {
    const { dbUrl } = getConfig();
    connectionPromise = mongoose.connect(dbUrl, {
      family: 4,
      serverSelectionTimeoutMS: 30000,
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}

export async function disconnectDatabase() {
  connectionPromise = undefined;
  await mongoose.disconnect();
}
