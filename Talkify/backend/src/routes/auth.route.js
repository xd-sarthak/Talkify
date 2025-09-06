import express from "express";
import { signup, login, logout,onboarding } from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup",signup);

router.post("/login", login);

router.post("/logout", logout);

router.post("/onboarding", protectRoute, onboarding);

/**
 * @swagger
 * /api/auth/is-logged-in:
 *   get:
 *     summary: Check if user is logged in
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User is logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - user not logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
//to check if the user is logged in
router.get("/is-logged-in", protectRoute, (req,res) =>{
    res.status(200).json({success: true, user: req.user});
});

export default router;