import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import { UserModel } from "./models/user.model.js";

export const authenticationDB = async ()=>{
    try {
        const result = await mongoose.connect(DB_URI)
        await UserModel.syncIndexes()
        console.log(`DB connected successfully ✌`);
        
    } catch (error) {
        console.log(`Fail to connect on DB ${error} 😵`);
        
    }
}