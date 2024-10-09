import express from "express";
import { registerUser, loginUser, refreshToken } from "../controllers/userController.js";

const router = express.Router();

// TODO
// router.get('/', getUsers);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
export default router;