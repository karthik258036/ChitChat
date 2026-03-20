const supabase = require("../config/supabase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// =======================
// SIGNUP
// =======================
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Signup request:", name, email);

    // Validate fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (findError) {
      console.log("Supabase Find Error:", findError);
      return res.status(500).json({ message: "Database error" });
    }

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
        },
      ])
      .select(); // VERY IMPORTANT for Supabase

    if (error) {
      console.log("Supabase Insert Error:", error);
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({
      message: "User registered successfully",
      user: data[0],
    });

  } catch (err) {
    console.log("Signup Catch Error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};



// =======================
// LOGIN
// =======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.log("Supabase Login Error:", error);
      return res.status(500).json({ message: "Database error" });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });

  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};