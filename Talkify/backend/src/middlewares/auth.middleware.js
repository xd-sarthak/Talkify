import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protectRoute = asyncHandler(async (req, res, next) => {
    try {
        // Check for token in Authorization header (Bearer token) or cookies
        let token = req.cookies.accessToken;
        
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        
        if(!token){
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        // Check if JWT secret is configured
        if (!process.env.ACCESS_TOKEN_SECRET) {
            console.error("ACCESS_TOKEN_SECRET is not configured");
            return res.status(500).json({ message: "Server configuration error" });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        if(!decoded){
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }

        const user = await User.findById(decoded._id).select("-password");
        if(!user){
            return res.status(401).json({ message: "Unauthorized - User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        return res.status(401).json({ message: "Unauthorized - Token verification failed" });
    }

});