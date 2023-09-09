const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  };
  
  // Register User
  const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
  
    // Validation
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please fill in all required fields");
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be up to 6 characters");
    }
  
    // Check if user email already exists
    const userExists = await User.findOne({ email });
  
    if (userExists) {
      res.status(400);
      throw new Error("Email has already been registered");
    }
  
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });
  
    //   Generate Token
    const token = generateToken(user._id);
  
    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 7* 1000 * 86400), // 7 day
      sameSite: "none",
      secure: true,
    });
  
    if (user) {
      const { _id, name, email, photo, phone, bio } = user;
      res.status(201).json({
        _id,
        name,
        email,
        photo,
        phone,
        bio,
        token,
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  });
  
  // Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate Request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  // User exists, check if password is correct
  //const passwordIsCorrect = await bcrypt.compare(password, user.password);

  //   Generate Token
  const token = generateToken(user._id);

  // Send HTTP-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 1000 * 86400), // 7 day
    sameSite: "none",
    // secure: true,
  });


if (user && password) {
  const { _id, name, email, photo, phone, bio } = user;
  res.status(200).json({
    _id,
    name,
    email,
    photo,
    phone,
    bio,
    token,
  });
} else {
  res.status(400);
  throw new Error("Invalid email or password");
}
});
// Logout User
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    // secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// Get User 
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
    });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});


//Get loging status
const loginStatus = asyncHandler(async(req,res)=>{
  const token = req.cookies.token;
  if(!token){
    return res.json(false);
  }
  //veryfy Token
  const veryfyToken = jwt.verify(token,process.env.JWT_SECRET);
  if(veryfyToken){
    return res.json(true);
  }
  return res.json(false);
});

//UpdateUser
const updateUser = asyncHandler(async (req,res)=>{
  const user = await User.findById(req.user._id);

  if(user){
    const { name, email, photo, phone, bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.photo = req.body.photo || photo;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    
    const UpdatedUser = await user.save();
    res.status(200).json({
      _id: UpdatedUser._id,
      name: UpdatedUser.name,
      email:UpdatedUser.email, 
      photo:UpdatedUser.photo,
      phone:UpdatedUser.phone,
      bio:UpdatedUser.bio
     
    });
  }else{
    res.status(400);
    throw new Error("user not found");
  }
});

//changePassword
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await User.save();
    res.status(200).send("Password change successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

const forgetPassword = asyncHandler(async (req,res)=>{

  const { email } = req.body;
  const user = await User.findOne({ email });

   if(!user){
    res.status(400);
    //throw new Error("User does not exist");
    console.log("User does not exist");
   }
   //Delete token if it exists in DB
   let token =await Token.findOne({userId:user._id});
   if(token){
   await token.deleteOne ;
   }

   //Create Reset Token
   let resetToken = crypto.randomBytes(32).toString("hex") + user._id ;
   console.log("========",resetToken);

   //Hash token before saving to DB
   const hashedToken = crypto
   .createHash("sha256")
   .update(resetToken)
   .digest("hex");
   
   console.log("++++++++",hashedToken);
   res.send("Forgot Password updated")

// Save Token to DB

 await new Token({
  userId: user._id,
  token: hashedToken,
  createdAt: Date.now(),
  expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
}).save();

//construct Reset Url
const resetUrl = `${process.env.FRONTEND_URl}/resetpassword/${resetToken}`;

//Reset Email
  const message = `
      <h2>Hello ${user.name}</h2>
      <p>Please use the url below to reset your password</p>  
      <p>This reset link is valid for only 30minutes.</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      <p>Regards...</p>
      <p>Pinvent Team</p>
    `;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});
// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare to Token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // fIND tOKEN in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});


module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgetPassword,
  resetPassword
};
  