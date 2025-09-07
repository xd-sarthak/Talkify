import express from "express";
import {protectRoute} from "../middlewares/auth.middleware.js";
import { getRecommendations,getMyFriends,getFriendRequests,sendFriendRequest,getOutgoingFriendRequests,accceptFriendRequests } from "../controllers/user.controller.js";

const router = express.Router();
router.use(protectRoute);

router.get("/",getRecommendations);
router.get("/friends",getMyFriends);

router.post("/friend-request/:id",sendFriendRequest);
router.put("/friend-request/accept/:id",accceptFriendRequests);

router.get("/friend-requests",getFriendRequests);
router.get("/outgoing-friend-requests",getOutgoingFriendRequests);

export default router;
