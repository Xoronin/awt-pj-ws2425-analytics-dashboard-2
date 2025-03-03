import express from "express";
import { ObjectId } from "mongodb";

const apiRouter = (db) => {
    const router = express.Router();

    // Get a list of XAPI statements
    router.get("/statements", async (req, res, next) => {
        let collection = await db.collection("xapi_statements");
        let results = await collection.find({}).toArray();
        res.send(results).status(200);
    });

    // Fetch the latest XAPI statements
    router.get("/statements/latest", async (req, res, next) => {
        let collection = await db.collection("xapi_statements");
        let results = await collection.find({})
            .sort({ timestamp: -1 })
            .limit(3)
            .toArray();
        res.send(results).status(200);
    });

    // Get a single XAPI statement
    router.get("/statements/:id", async (req, res, next) => {
        let collection = await db.collection("xapi_statements");
        let query = { _id: ObjectId(req.params.id) };
        let result = await collection.findOne(query);
        if (!result) res.send("Not found").status(404);
        else res.send(result).status(200);
    });

    // Add a new XAPI statement
    router.post("/statements", async (req, res, next) => {
        let collection = await db.collection("xapi_statements");

        //remove all statements
        await collection.deleteMany({});

        let newStatements = req.body;
        let result = await collection.insertMany(newStatements);
        res.send(result).status(204);
    });

    // Add new LOM
    router.post("/lom", async (req, res) => {
        try {
            const collection = await db.collection("lom_data");

            // Drop all entries
            await collection.deleteMany({});

            const lomDataArray = req.body;
            if (!Array.isArray(lomDataArray) || lomDataArray.length === 0) {
                return res.status(400).json({
                    message: 'Invalid input: expected non-empty array of LOM data'
                });
            }

            // Create unique index
            await collection.createIndex(
                { 'general.identifier.entry': 1 },
                { unique: true }
            );

            const result = await collection.insertMany(lomDataArray);

            res.status(201).json({
                message: `Successfully stored ${result.insertedCount} LOM data documents`,
                insertedIds: result.insertedIds
            });

        } catch (error) {
            console.error('Error storing LOM data:', error);
            res.status(500).json({
                message: 'Error storing LOM data',
                error: error.message
            });
        }
    });

    // Get all LOM data
    router.get("/lom", async (req, res) => {
        try {
            const collection = await db.collection("lom_data");
            const data = await collection.find({}).toArray();
            res.json(data);
        } catch (error) {
            console.error('Error fetching LOM data:', error);
            res.status(500).json({
                message: 'Error fetching LOM data',
                error: error.message
            });
        }
    });

    // Add Verbs
    router.post("/verbs", async (req, res) => {
        try {
            const collection = await db.collection("verbs");

            // Drop all indexes
            await collection.dropIndexes();

            // Drop all entries
            await collection.deleteMany({});

            const existingCount = await collection.countDocuments();
            if (existingCount > 0) {
                return res.status(400).json({
                    message: 'Verbs already exist in database'
                });
            }

            const verbs = req.body;
            if (!Array.isArray(verbs) || verbs.length === 0) {
                return res.status(400).json({
                    message: 'Invalid input: expected non-empty array of verbs'
                });
            }

            //Create unique index
            await collection.createIndex(
                { 'id': 1 },
                { unique: true }
            );

            const result = await collection.insertMany(verbs);

            res.status(201).json({
                message: `Successfully stored ${result.insertedCount} verbs`,
                insertedIds: result.insertedIds
            });

        } catch (error) {
            console.error('Error storing verbs:', error);
            res.status(500).json({
                message: 'Error storing verbs',
                error: error.message
            });
        }
    });

    // Get all Verbs
    router.get("/verbs", async (req, res) => {
        try {
            const collection = await db.collection("verbs");
            const data = await collection.find({}).toArray();
            res.json(data);
        } catch (error) {
            console.error('Error fetching verbs:', error);
            res.status(500).json({
                message: 'Error fetching verbs',
                error: error.message
            });
        }
    });

    // Add Learner Profiles
    router.post("/learners", async (req, res) => {
        try {
            const collection = await db.collection("learner_profiles");

            // Drop all indexes
            await collection.dropIndexes();

            // Drop all entries
            await collection.deleteMany({});

            const learners = req.body;
            if (!Array.isArray(learners) || learners.length === 0) {
                return res.status(400).json({
                    message: 'Invalid input: expected non-empty array of learners'
                });
            }

            const result = await collection.insertMany(learners);

            res.status(201).json({
                message: `Successfully stored ${result.insertedCount} learners`,
                insertedIds: result.insertedIds
            });

        } catch (error) {
            console.error('Error storing learners:', error);
            res.status(500).json({
                message: 'Error storing learners',
                error: error.message
            });
        }
    });

    // Get all learner profiles
    router.get("/learners", async (req, res) => {
        try {
            const collection = await db.collection("learner_profiles");
            const data = await collection.find({}).toArray();
            res.json(data);
        } catch (error) {
            console.error('Error fetching learners:', error);
            res.status(500).json({
                message: 'Error fetching learners',
                error: error.message
            });
        }
    });

    return router;
};

export default apiRouter;