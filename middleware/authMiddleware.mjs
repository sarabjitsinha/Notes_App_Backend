import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
 
  let token = req.cookies.token || req.headers.authorization?.split(" ")[1] || req.headers["x-token"];
   if (!token) return res.status(401).json({ msg: "No token, auth denied" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = await User.findById(decoded.id).select("-password");
    
    next();
  } catch (err) {
    console.log("Token not found")
    res.status(401).json({ msg: "Token invalid" });
  }
};
