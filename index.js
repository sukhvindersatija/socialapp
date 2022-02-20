const express=require('express');
const app=express();
const mongoose=require('mongoose');
const helmet=require('helmet');
const dotenv=require('dotenv');
const morgan=require('morgan');
const userRoutes=require('./routes/users.js');
const authRoutes=require('./routes/auth.js');
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

dotenv.config();

app.use('/user',userRoutes);
app.use('/auth',authRoutes);
mongoose.connect(process.env.MONGO_URL,()=>{
    console.log("Connected with mongodb");
})

app.listen(8080,()=>{
    console.log("Connected")
})