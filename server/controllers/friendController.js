const supabase = require("../config/supabase");

// 🔵 SEND FRIEND REQUEST
exports.sendFriendRequest = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({ error: "Missing IDs" });
    }

    // Prevent self request
    if (sender_id === receiver_id) {
      return res.status(400).json({ error: "Cannot add yourself" });
    }

    // Check existing request
    const { data: existing, error: checkError } = await supabase
      .from("friends")
      .select("*")
      .or(
        `and(sender_id.eq.${sender_id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${sender_id})`
      );

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.json({ message: "Request already exists" });
    }

    const { data, error } = await supabase
      .from("friends")
      .insert([
        {
          sender_id,
          receiver_id,
          status: "pending",
        },
      ])
      .select();

    if (error) throw error;

    res.json({ message: "Friend request sent", data });
  } catch (err) {
    console.error("Send Friend Request Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🟡 GET INCOMING FRIEND REQUESTS (FOR FRIENDS PAGE)
exports.getIncomingRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: requests, error } = await supabase
      .from("friends")
      .select("*")
      .eq("receiver_id", userId)
      .eq("status", "pending");

    if (error) throw error;

    res.json(requests || []);
  } catch (err) {
    console.error("Incoming Requests Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 ACCEPT FRIEND REQUEST
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { request_id } = req.body;

    if (!request_id) {
      return res.status(400).json({ error: "Request ID required" });
    }

    const { data, error } = await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("id", request_id)
      .select();

    if (error) throw error;

    res.json({ message: "Friend request accepted", data });
  } catch (err) {
    console.error("Accept Request Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 GET ACCEPTED FRIENDS (USED BY YOUR Chat.jsx)
exports.getFriends = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .eq("status", "accepted")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Get Friends Error:", err);
    res.status(500).json({ error: err.message });
  }
};