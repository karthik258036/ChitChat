const express = require("express");
const router = express.Router();

const {
  saveMessage,
  getMessages,
} = require("../controllers/messageController");

// Save message to DB
router.post("/save", saveMessage);

// Get chat history
router.get("/history", getMessages);

module.exports = router;