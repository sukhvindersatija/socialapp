const express=require('express');

const router=express.Router();
const mongoose=require("mongoose");
const Transaction = require("mongoose-transactions");
const transaction = new Transaction();
const User = require("../models/User");

const bcrypt = require("bcrypt");

//update user
router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

router.delete("/:id", async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
      try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json("Account has been deleted");
      } catch (err) {
        return res.status(500).json(err);
      }
    } else {
      return res.status(403).json("You can delete only your account!");
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      const { password, updatedAt, ...other } = user._doc;
      res.status(200).json(other);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  router.put("/:id/follow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
      try {
        const user = await User.findById(req.params.id);
        const currentUser = await User.findById(req.body.userId);
        if (!user.followers.includes(req.body.userId)) {
          await user.updateOne({ $push: { followers: req.body.userId } });
          await currentUser.updateOne({ $push: { followings: req.params.id } });
          res.status(200).json("user has been followed");
        } else {
          res.status(403).json("you allready follow this user");
        }
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(403).json("you cant follow yourself");
    }
  });
  
  //unfollow a user
  
  router.put("/:id/unfollow", async (req, res) => {
      if (req.body.userId !== req.params.id) {
        try {
          const user = await User.findById(req.params.id);
          const currentUser = await User.findById(req.body.userId);
          if (user.followers.includes(req.body.userId)) {
            await user.updateOne({ $pull: { followers: req.body.userId } });
            await currentUser.updateOne({ $pull: { followings: req.params.id } });
            res.status(200).json("user has been unfollowed");
          } else {
            res.status(403).json("you dont follow this user");
          }
        } catch (err) {
          res.status(500).json(err);
        }
      } else {
        res.status(403).json("you cant unfollow yourself");
      }
    });
  router.put("/:id/request",async(req,res,next)=>{
    const senderId=req.params.id;
    const recieverId=req.body.id;
    try{
      transaction.update("User",senderId,{$push:{
        sentRequests:recieverId
      }});
      transaction.update("User",recieverId,{$push:{
        pendingRequests:senderId
      }});
      const final = await transaction.run();
      res.status(200).json("request sent");
    }
    catch(err){
      console.log(err);
      const rollbackObj = await transaction.rollback().catch(console.error);
      transaction.clean();
    }

  })

  router.get('/:id/pendingRequests',(req,res,next)=>{
    User.findById(req.params.id).then(user=>{
      if(user.pendingRequests.length==0){
        res.status(403).json("No pending Requests");
      }
      else{
        res.status(200).json(user.pendingRequests);
      }
    }).catch(err=>{
      console.log(err);
    })
  });

  router.put('/:id/accept',async (req,res,next)=>{
    const owner=req.params.id;
    const sender=req.body.id;
    try{
      transaction.update("User",owner,{$pull:{
        pendingRequests:sender
      }});
      transaction.update("User",sender,{$pull:{
        sentRequests:owner
      }});
      transaction.update("User",owner,{$push:{
        friends:sender
      }});
      transaction.update("User",sender,{$push:{
        friends:sender
      }});
      const final = await transaction.run();
      res.status(200).json("Added as your friend");
    }
    catch(err){
      console.log(err);
      const rollbackObj = await transaction.rollback().catch(console.error);
      transaction.clean();
    }

  })

  router.get('/:id/pendingRequests',(req,res,next)=>{
    User.findById(req.params.id).then(user=>{
      if(user.pendingRequests.length==0){
        res.status(403).json("No pending Requests");
      }
      else{
        res.status(200).json(user.pendingRequests);
      }
    }).catch(err=>{
      console.log(err);
    })
    })

module.exports=router;