import express from "express";
import cors from "cors";

import foldersRouter from "./routes/folders.js";
import usersRouter from "./routes/users.js";
import documentsRouter from "./routes/document.js";
import llmRouter from "./routes/llm.js";
import templatesRouter from "./routes/template.js";

import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const PORT = process.env.PORT || 5050;
const app = express();
// const mongoURI = process.env.ATLAS_URI || "";
const mongoURI = "mongodb://127.0.0.1:27017/test";

const corsOptions = {
    origin: ["http://localhost:3000", "*"],
    credentials: true,
    exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());


mongoose.connect(mongoURI)
        .then(() => console.log("MongoDB Connected."))
        .catch(err => console.error(err));

app.use(cookieParser());
app.use("/folders", foldersRouter);
app.use("/users", usersRouter);
app.use("/documents", documentsRouter);
app.use("/llm", llmRouter);
app.use("/templates", templatesRouter);

// start the Express server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});