import mongoose from "mongoose";

async function connectDB() {
    
    try {
        await mongoose.connect(process.env.MONGO_DB_URI)
        console.log("Mongodb successfully connected")
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }

}

export default connectDB;