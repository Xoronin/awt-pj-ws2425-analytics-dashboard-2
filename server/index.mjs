import express from "express";
import cors from "cors";
import "./loadEnvironment.mjs";
import "express-async-errors";
import { connectToMongoDB } from "./db/conn.mjs";
import router from "./routes/api.mjs";

const PORT = process.env.PORT || 5050;
const app = express();

(async () => {
    try {
        const db = await connectToMongoDB();
        app.use(express.json({ limit: "10mb" })); 
        app.use(cors());

        // Load the /api routes
        app.use("/api", router(db));

        // start the Express server
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        });
    } catch (error) {
        console.error("Error starting the server:", error);
    }
})();