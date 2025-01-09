const { Router } = require("express");
const usersController = require("../controllers/usersController");
const usersRouter = Router();
const authenticate = require("../middleware/authenticate");
const uploadMiddleware = require("../middleware/multer");
usersRouter.get("/", authenticate, usersController.allUsers);
usersRouter.get("/:userId", authenticate, usersController.getUser);
usersRouter.put(
  "/:userId",
  uploadMiddleware,
  authenticate,
  usersController.updateUser
);
usersRouter.get("/:userId/feed", authenticate, usersController.getAllPosts);
usersRouter.get(
  "/:userId/followingFeed",
  authenticate,
  usersController.getFollowingPosts
);

usersRouter.get(
  "/:userId/likedPosts",
  authenticate,
  usersController.getLikedPosts
);
usersRouter.get(
  "/:userId/followers",
  authenticate,
  usersController.getFollowers
);
usersRouter.get(
  "/:userId/following",
  authenticate,
  usersController.getFollowing
);
usersRouter.post("/:userId/following", authenticate, usersController.follow);
usersRouter.delete("/:userId/unfollow", authenticate, usersController.unfollow);

usersRouter.get(
  "/:userId/messages",
  authenticate,
  usersController.getUserMessages
);
usersRouter.post(
  "/:userId/messages",
  authenticate,
  usersController.postUserMessages
);

usersRouter.get(
  "/:userId/messages/:messageId",
  authenticate,
  usersController.getMessageById
);
usersRouter.post(
  "/:userId/messages/:messageId",
  authenticate,
  usersController.postReplyToMessage
);
usersRouter.delete(
  "/:userId/notifications/:notificationId",
  authenticate,
  usersController.deleteNotification
);
module.exports = usersRouter;
