require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const requestLogger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const emailRoutes = require("./routes/emailRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api", emailRoutes);

// Error handler must be mounted after all other routes and middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n✉️  Email Generator running at: http://localhost:${PORT}\n`);
});

