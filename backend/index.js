const express=require("express");
const dotenv=require("dotenv");
const connectDB = require("./db");
const rootRouter = require("./routes/index.routes");
const cors=require("cors");


app.use(cors());
app.use(express.json());
dotenv.config();


const app=express();
app.use("/api/v1", rootRouter);

const PORT= process.env.PORT || 3001;


app.listen(PORT,()=>{
    connectDB();
    console.log(`Server is running on port: ${PORT}`);
})

