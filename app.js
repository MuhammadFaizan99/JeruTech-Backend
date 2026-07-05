import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.get(["/", "/api"], (req, res) => {
  res.json({
    success: true,
    message: "JeruTech Backend API is running",
    docs: "/api/products",
  });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
