const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// Get all users (except current user later in frontend)
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email");

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.log("Fetch Users Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;