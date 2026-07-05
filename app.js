import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("JeruTech Backend API is running");
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
