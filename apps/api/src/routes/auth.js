import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { currentUser, loginUser, registerUser } from "../controllers/authController.js";

const router = Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/me", authenticate, currentUser);

export default router;
