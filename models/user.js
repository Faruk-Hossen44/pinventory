const  mongoose  = require("mongoose");
const bcrypt = require("bcryptjs");
const useSchema = mongoose.Schema(
    {name:{
        type:String,
        required:[true,"please add a name"]
    },
    email:{
        type:String,
        required:[true,"please add a email"],
        unique:true,
        trim:true,
        match: [ /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email"] 
    },
    password:{
        type:String,
        required:[true,"please add a password"],
        minLength:[6,"password must be up to 6 characters"],
        maxLength:[23,"password must not be more than 23 characrers"],

    },
    photo:{
        type:String,
       // required:[true,"please add a photo"],
        default:"https://i.ibb.co/4pDNDk1/avatar.png"
    },
    phone:{
        type:String,
        defaulta: "+880"
    },

    bio:{
        type:String,
        maxLength:[250,"Bio must not be more than 250 charactre"],
        default:"Bio"
    },
},
    { timestamps: true,versionKey: false }

);
 
//Encrypt password before saving to DB
useSchema.pre("save",async function(next){
    if(!this.isModified("Password")){
        return next();''
    }


// Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
})
const User = mongoose.model("user",useSchema);
module.exports = User;