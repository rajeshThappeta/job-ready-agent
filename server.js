import "dotenv/config"
import express from "express";
import { chatRouter } from "./api/chat.router.js";



const app = express();
const port = process.env.PORT || 5001;

// body parser middleware
app.use(express.json());

// request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
    );
  });
  next();
});

// health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Health check completed" });
});

// routes will be mounted here, above the 404 and error handlers
app.use("/api/chat", chatRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// error handling middleware (must stay last)
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  console.error(err);
  res.status(statusCode).json({
    status: "error",
    message: statusCode >= 500 ? "Internal server error" : err.message,
  });
});

// start server
app.listen(port, () => console.log(`server listening on port ${port}`));
