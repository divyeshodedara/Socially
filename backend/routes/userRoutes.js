import express from "express";
import upload from "../middleware/multer.js";
import authMiddleware from "../middleware/authMiddleware.js";
import * as userController from "../controllers/userControllers.js";

const router = express.Router();

//protect routes after this middleware
router.use(authMiddleware);

router.get("/me", userController.getMe);
router.get("/search", userController.searchUsers);
router.get("/profile/:id", userController.getProfile);
router.get("/suggested-users", userController.suggestedUser);

router.post("/follow/:id", userController.followUser);
router.post("/unfollow/:id", userController.unfollowUser);
router.post("/edit-profile", upload.single("profilePicture"), userController.editProfile);

export default router;
