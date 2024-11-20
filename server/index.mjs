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
        app.use(express.json({ limit: "10mb" })); // Adjust the limit as needed
        app.use(cors());

        // Load the /api routes
        app.use("/api", router(db));

        // Global error handling
        //app.use((err, _req, res, next) => {
        //    res.status(500).send("Uh oh! An unexpected error occurred.");
        //});

        // start the Express server
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        });
    } catch (error) {
        console.error("Error starting the server:", error);
    }
})();