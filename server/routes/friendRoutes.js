const express = require("express");
const router = express.Router();

// In-memory storage (works instantly)
let friendRequests = [];
let friends = [];

/**
 * SEND FRIEND REQUEST
 * POST /api/friends/send
 */
router.post("/send", (req, res) => {
  try {
    const { sender_id, receiver_id, sender_name } = req.body;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({ message: "Missing sender or receiver id" });
    }

    if (sender_id === receiver_id) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    // Prevent duplicate
    const exists = friendRequests.find(
      (r) =>
        r.sender_id === sender_id &&
        r.receiver_id === receiver_id &&
        r.status === "pending"
    );

    if (exists) {
      return res.json({ message: "Request already sent" });
    }

    // Check already friends
    const alreadyFriends = friends.find(
      (f) =>
        (f.sender_id === sender_id && f.receiver_id === receiver_id) ||
        (f.sender_id === receiver_id && f.receiver_id === sender_id)
    );

    if (alreadyFriends) {
      return res.json({ message: "Already friends" });
    }

    const newRequest = {
      id: Date.now().toString(),
      sender_id,
      receiver_id,
      sender_name: sender_name || "Unknown User",
      status: "pending",
      created_at: new Date(),
    };

    friendRequests.push(newRequest);

    res.json({
      message: "Friend request sent",
      request: newRequest,
    });
  } catch (err) {
    console.error("SEND REQUEST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET INCOMING REQUESTS (WITH NAME)
 * GET /api/friends/incoming/:userId
 */
router.get("/incoming/:userId", (req, res) => {
  try {
    const { userId } = req.params;

    const incoming = friendRequests.filter(
      (r) => r.receiver_id === userId && r.status === "pending"
    );

    res.json(incoming);
  } catch (err) {
    console.error("INCOMING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ACCEPT FRIEND REQUEST
 * POST /api/friends/accept
 */
router.post("/accept", (req, res) => {
  try {
    const { request_id } = req.body;

    const request = friendRequests.find((r) => r.id === request_id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "accepted";

    // Add to friends list (bidirectional)
    friends.push({
      sender_id: request.sender_id,
      receiver_id: request.receiver_id,
    });

    res.json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("ACCEPT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ❌ REJECT FRIEND REQUEST (NEW)
 * POST /api/friends/reject
 */
router.post("/reject", (req, res) => {
  try {
    const { request_id } = req.body;

    const request = friendRequests.find((r) => r.id === request_id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "rejected";

    res.json({ message: "Friend request rejected" });
  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET FRIENDS LIST
 * GET /api/friends/friends/:userId
 */
router.get("/:userId", (req, res) => {
  try {
    const { userId } = req.params;

    const userFriends = friends.filter(
      (f) =>
        f.sender_id === userId ||
        f.receiver_id === userId
    );

    res.json(userFriends);
  } catch (err) {
    console.error("FRIENDS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;