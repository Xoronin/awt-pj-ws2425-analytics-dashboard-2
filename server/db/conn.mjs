import dotenv from 'dotenv';
import { MongoClient } from "mongodb";

dotenv.config();

const connectionString = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || "";

export async function connectToMongoDB() {
    const client = new MongoClient(connectionString);
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        return client.db(dbName);
    } catch (e) {
        console.error("Connection error:", e);
        throw e;
    }
}