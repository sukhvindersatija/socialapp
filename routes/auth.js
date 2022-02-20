const express=require('express');
const User = require('../models/User');
const bcrypt=require('bcrypt');
const router=express.Router();


router.post('/api/auth',async(req,res,next)=>{
    try{
    const salt=await bcrypt.genSalt(10);
    const hashpassword=await bcrypt.hash(req.body.password,salt);
    const newUser=new User({
        username:req.body.name,
        email:req.body.email,
        password:hashpassword
    });
    
    const user= await newUser.save()
        res.status(200).json(user);
    }

    catch(err){
        console.log(err);
    }
});
router.post("/login", async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if(!user){ 
        res.status(404).json("user not found");
      }
  
      const validPassword = await bcrypt.compare(req.body.password, user.password)
      if(!validPassword){
        res.status(400).json("wrong password")
      }
      res.status(200).json(user)
    } catch (err) {
      res.status(500).json(err)
    }
  });
module.exports=router;