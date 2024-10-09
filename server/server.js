import express from "express";
import cors from "cors";
import foldersRouter from "./routes/folders.js";
import usersRouter from "./routes/users.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5050;
const app = express();
const mongoURI = process.env.ATLAS_URI || "";

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(express.json());

mongoose.connect(mongoURI)
        .then(() => console.log("MongoDB Connected."))
        .catch(err => console.error(err));

app.use("/folders", foldersRouter);
app.use("/users", usersRouter);

// start the Express server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});