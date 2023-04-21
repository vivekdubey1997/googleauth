const express = require(`express`)
const userRouter = express.Router()
const mongoose = require(`mongoose`)
const userfeed = mongoose.model(`userFeed`)
const {phone} = require(`phone`)
const {secretKey} = require(`../secret.js`)
const jwt = require(`jsonwebtoken`)
var AWS = require(`aws-sdk`);

AWS.config.update({
  region : `ap-southeast-1`
})

let validatePhone=(phoneNo)=>{
 return phone(phoneNo);
}

function sendOTP(phoneNumber,otp){
  const params = {
    Message : `This is for the development test. Your OTP is ${otp} and it is valid till next 10 minutes. All the Best Buddy.`,
    PhoneNumber : phoneNumber
  }
  return new AWS.SNS({apiVersion : `2010-03-31`}).publish(params).promise()
  .then((message)=>{
    console.log(`OTP sent successfully`, message)
  })
  .catch((err)=>{
    console.log(`Error`,err)
    return err
  })
}


userRouter.post(`/signup/`, (req,res)=>{
  const {name,country,phoneNo} = req.body 
  const phoneNumber = country+phoneNo
  if(!name || !phoneNo || !country){
    return res.json({Error : "Please fill all the fields"})
  }
  else if(name.length<4 || phoneNo.length!=10){
    console.log(`error with phoneNo`)
    return res.status(403).json({Error : "Invalid Name or phoneNo No."})
  }
  else if(!validatePhone(phoneNumber).isValid){
    return res.status(403).json({Error : "Invalid phone No."})
  }
  userfeed.findOne({PhoneNumber : phoneNumber})
  .then((saveduser)=>{
    if(saveduser!=null){
        return res.status(403).json({Error : "phone No. already exist please login"})
    }
    else if(saveduser == null){
  
        const storeuser = new userfeed({
            Name : name,
            PhoneNumber : phoneNumber
        })
        storeuser.save()
        .then((savedUser)=>{
          const otp = Math.floor(Math.random()*900000+100000)
          let genDate = new Date()
          const genTime = Math.floor(genDate.getTime()/60000)
          // console.log(genDate.getTime(),genTime)
          // console.log(otp)
          
          userfeed.updateOne({PhoneNumber : phoneNumber},{$set: {otp : otp, otp_At : genTime}})
          .then((updated)=>{
            let message_id = sendOTP(phoneNumber,otp)
            console.log(`Data updated`)
            return res.status(200).json({message : "OTP has been sent to your Mobile no."})
          })
          .catch((err)=>{
            console.log(`while updating data`)
          })
          // res.json({message : "User saved"})
        })
        .catch((err)=>{
          console.log(`while saving user`,err)
        })
        console.log(storeuser)
       
    }
  })
  .catch((err)=>{
    console.log(`while Matching user`)
  })
})

userRouter.post(`/login/`,(req,res)=>{
  const {phoneNo,otp} = req.body
  if(!phoneNo || !otp){
    return res.json({Error : "Please fill all the fields"})
  }
  else{
    let currDate = new Date()
    const currTime = Math.floor(currDate.getTime()/60000)
    // console.log(currDate,currTime)
  userfeed.findOne({PhoneNumber : phoneNo})
  .then((gotUser)=>{
    if(!gotUser){
      console.log(`not registered`)
      return res.json({error : "Mobile no. not registered signup first"})
    }
    else{
      let oldOtpTime = gotUser.otp_At
       if(gotUser.otp == otp && +currTime-10<=oldOtpTime){
        const token = jwt.sign({_id : gotUser._id},secretKey)
        console.log(`OTP matched`)
        return res.json({message : "OTP verified. Welcome to login page", "token" : token})
      }
      else{
        console.log(`Inavlid OTP`)
        return res.json({error : "Inavlid OTP"})
      }
    }
  })
  .catch((err)=>{
    console.log(`while finding user`,err)
  })
}
})
module.exports = userRouter