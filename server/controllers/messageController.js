const supabase = require("../config/supabase");

// ===============================
// SAVE MESSAGE
// ===============================
exports.saveMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, message } = req.body;

    if (!sender_id || !receiver_id || !message) {
      return res.status(400).json({ message: "All fields required" });
    }

    const { data, error } = await supabase.from("messages").insert([
      {
        sender_id,
        receiver_id,
        message,
      },
    ]);

    if (error) {
      console.log("Supabase Insert Error:", error);
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({
      message: "Message saved successfully",
      data,
    });
  } catch (err) {
    console.log("Save Message Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// GET MESSAGES (CLEAN VERSION)
// ===============================
exports.getMessages = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.query;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${sender_id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${sender_id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Fetch Messages Error:", error);
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.log("Get Messages Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};