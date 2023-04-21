const mongoose = require(`mongoose`)

const userSchema = new mongoose.Schema({
    Name : {
        type : String,
        required : true
    },
    PhoneNumber : {
        type : Number,
        required : true
    },
    otp : {
        type : Number
    },
    otp_At : {
        type : String
    }
})

mongoose.model(`userFeed` , userSchema)