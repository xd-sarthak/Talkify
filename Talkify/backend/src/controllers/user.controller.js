import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/APIresponse.js";
import FriendRequest from "../models/FriendRequest.js";

export const getRecommendations = asyncHandler(async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true },
      ],
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { recommendations },
          "Recommendations fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    throw new ApiError(500, "Error fetching recommendations");
  }
});

export const sendFriendRequest = asyncHandler(async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: recipientId } = req.params;

    if (myId === recipientId) {
      throw new ApiError(400, "You cannot send friend request to yourself");
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new ApiError(404, "Recipient not found");
    }

    if (recipient.friends.includes(myId)) {
      throw new ApiError(400, "You are already friends with this user");
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      throw new ApiError(400, "Friend request already sent");
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { friends }, "Friends fetched successfully"));
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw new ApiError(500, "Error fetching friends");
  }
});

export const getMyFriends = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate("friends","fullName profilePic nativeLanguage learningLanguage");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { friends: user.friends },
          "Friends fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw new ApiError(500, "Error fetching friends");
  }
});

export const accceptFriendRequests = asyncHandler(async (req, res) => {
    try {
      const {id : requestId} = req.params;

      const friendRequest = await FriendRequest.findById(requestId);

      if(!friendRequest){
        throw new ApiError(404,"Friend request not found");
      }

      if (friendRequest.recipient.toString() !== req.user.id) {
            throw new ApiError(403,"You cannot send friend requests");
      }

      friendRequest.status = "accepted";
      await friendRequest.save();

      await User.findByIdAndUpdate(friendRequest.sender,{
        $addToSet: { friends: friendRequest.recipient },
      });

      await User.findByIdAndUpdate(friendRequest.recipient, {
        $addToSet: { friends: friendRequest.sender },
      });

      return res.status(200).json({message: "friend request accepted"});

    } catch (error) {
      console.error("Error in acceptFriends: ", error);
      throw new ApiError(500, "internal server error");
    }
  });

export const getFriendRequests = asyncHandler(async (req, res) => {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user._id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");
  
    const acceptedReqs = await FriendRequest.find({
      sender: req.user._id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");
  
    if (!incomingReqs && !acceptedReqs) {
      throw new ApiError(404, "No friend requests found");
    }
  
    return res.status(200).json(
      new ApiResponse(
        200,
        { incomingReqs, acceptedReqs },
        "Friend requests fetched successfully"
      )
    );
  });
  
export const getOutgoingFriendRequests = asyncHandler(async (req, res) => {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");
  
    if (!outgoingRequests || outgoingRequests.length === 0) {
      throw new ApiError(404, "No outgoing friend requests found");
    }
  
    return res.status(200).json(
      new ApiResponse(
        200,
        outgoingRequests,
        "Outgoing friend requests fetched successfully"
      )
    );
  });