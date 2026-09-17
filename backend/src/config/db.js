import mongoose from "mongoose";

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URL)
        console.log('MongoDB is Connected Successfully')
    }
    catch(error){
        console.log('MongoDB connection failed due to:',error)
        process.exit(1)
    }
}

export default connectDB