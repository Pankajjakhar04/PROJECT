const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const app = express();
const port = 5000;

// Enable CORS for all origins (or specify if needed)
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// POST route for predicting student performance
app.post("/api/predict", (req, res) => {
    const { hours, assignments, attendance } = req.body;

    console.log("Received data:", req.body);

    // Ensure all required fields are present
    if (!hours || !assignments || !attendance) {
        return res.status(400).send("Missing required data (hours, assignments, attendance).");
    }

    // Spawn the Python process
    const python = spawn("python", ["predict.py", hours, assignments, attendance]);

    // Handle standard output from the Python script
    python.stdout.on("data", (data) => {
        const prediction = data.toString().trim();
        if (prediction && !res.headersSent) {
            console.log("Prediction result:", prediction);
            return res.json({ prediction });
        }
    });

    // Handle standard error from the Python script
    python.stderr.on("data", (data) => {
        const errorMessage = data.toString().trim();
        console.error("Python Error:", errorMessage);
        if (!res.headersSent) {
            return res.status(500).send(`Error in Python script: ${errorMessage}`);
        }
    });

    // Handle the closing of the Python process
    python.on("close", (code) => {
        if (code !== 0 && !res.headersSent) {
            console.error(`Python process exited with code ${code}`);
            return res.status(500).send("Error in prediction: Python process failed.");
        }
    });

    // Handle any unhandled errors from the spawn process
    python.on("error", (err) => {
        console.error("Error spawning Python process:", err);
        if (!res.headersSent) {
            return res.status(500).send("Internal server error: Failed to start Python process.");
        }
    });
});

// Start the server and listen on all network interfaces
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${port} (accessible from both localhost and local IP address)`);
});
