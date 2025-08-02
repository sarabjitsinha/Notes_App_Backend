import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2d" });

export const register = async (req, res) => {
  const { username, password } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const user = await User.create({ username, password });
    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.json({ user: { id: user._id, username } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ msg: "Invalid credentials" });

    const token = generateToken(user);
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   samSite:"Lax",
    //   secure:false
    // });
    res.setHeader("x-token",token)
    console.log(token)
    res.json({ user: { id: user._id.toString(), username } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
  
};

export const logout = (req, res) => {
  res.clearCookie("token").json({ msg: "Logged out" });
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};
