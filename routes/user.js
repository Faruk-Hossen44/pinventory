const express = require("express");
const router = express.Router();
const { 
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword
 } = require("../controllers/user");
 const protect = require("../middlewares/auth");


router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/logout", logout);
router.get("/getuser", protect, getUser);
router.get("/logging",loginStatus);
router.patch("/updateUser",protect, updateUser);
router.patch("/changePassword",protect, changePassword);

module.exports = router;