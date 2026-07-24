
import mongoose from "mongoose";


const MONGODB_URI = process.env.MONGODB_URI;

console.log(MONGODB_URI)

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Cache the connection across hot reloads in development and across
 * serverless invocations so we don't open a new connection on every request.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string)
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
