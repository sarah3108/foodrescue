const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");

const router = express.Router();

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const passwordHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return { passwordHash, passwordSalt: salt };
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  next();
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordFields = hashPassword(password);
    const user = await User.create({
      name,
      email,
      role,
      ...passwordFields
    });

    res.status(201).json({
      message: "Account created",
      user: publicUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const { passwordHash } = hashPassword(password, user.passwordSalt);

    if (passwordHash !== user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Logged in",
      user: publicUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to log in" });
  }
});

router.put("/:id", validateId, async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: "Name, email, and role are required" });
    }

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.params.id }
    });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated",
      user: publicUser(updatedUser)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to update profile" });
  }
});

module.exports = router;
