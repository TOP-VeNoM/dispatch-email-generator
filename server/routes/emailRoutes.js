const express = require("express");
const router = express.Router();

const { generateEmail } = require("../controllers/emailController");

router.post("/generate-email", generateEmail);

module.exports = router;

