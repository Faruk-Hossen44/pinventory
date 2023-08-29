const express = require("express");
const router = express.Router();
const { 
    registerUser,
    loginUser,
    logout,
    getUser
 } = require("../controllers/user");
 const protect = require("../middlewares/auth");


router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/logout", logout);
router.get("/getuser", protect, getUser);

module.exports = router;