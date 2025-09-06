import {StreamChat} from "stream-chat";
import "dotenv/config";
import { ApiError } from "../utils/APIerror.js";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET; 

if(!apiKey || !apiSecret){
    console.log("Stream API missing");   
}

const streamClient = StreamChat.getInstance(apiKey,apiSecret);

export const upsertStreamUser = async (userData) => {
    try {
        await streamClient.upsertUsers([userData]);
        return userData;
    } catch (error) {
        throw new ApiError(500,"Error upserting stream user",error);
    }
};

export const generateStreamToken = (userId) => {
    try {
        const userIdString = userId.toString();
        const token = streamClient.createToken(userIdString);
        return token;
    } catch (error) {
        throw new ApiError(500,"Error generating stream token",error);
    }
};
