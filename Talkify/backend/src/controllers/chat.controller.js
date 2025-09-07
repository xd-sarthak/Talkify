import { generateStreamToken } from "../lib/stream.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIerror.js";

/**
 * @swagger
 * /api/chat/stream-token:
 *   get:
 *     summary: Get Stream chat token for real-time messaging
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Stream token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StreamTokenResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const getStreamToken = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const token = generateStreamToken(userId);
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error("Error generating stream token:", error);
        throw new ApiError(500, "Error generating stream token");
    }
});