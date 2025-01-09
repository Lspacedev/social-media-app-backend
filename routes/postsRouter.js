const { Router } = require("express");
const postsController = require("../controllers/postsController");
const postsRouter = Router({ mergeParams: true });
const authenticate = require("../middleware/authenticate");
const upload = require("../middleware/uploadSingle");

postsRouter.get("/", authenticate, postsController.allAuthorPosts);
postsRouter.post(
  "/",
  upload.single("image"),
  authenticate,
  postsController.createPost
);
postsRouter.get("/:postId", authenticate, postsController.getAuthorPost);
postsRouter.put(
  "/:postId",
  upload.single("image"),
  authenticate,
  postsController.updatePost
);

postsRouter.delete("/:postId", authenticate, postsController.deletePost);
postsRouter.get("/:postId/comments", authenticate, postsController.getComments);
postsRouter.get(
  "/:postId/comments/:commentId",
  authenticate,
  postsController.getComment
);
postsRouter.post("/:postId/comments", authenticate, postsController.addComment);
postsRouter.put(
  "/:postId/comments/:commentId",
  authenticate,
  postsController.updateComment
);
postsRouter.delete(
  "/:postId/comments/:commentId",
  authenticate,
  postsController.deleteComment
);
postsRouter.post("/:postId/likes", authenticate, postsController.likePost);
postsRouter.delete(
  "/:postId/likes/:likeId",
  authenticate,
  postsController.unlikePost
);

module.exports = postsRouter;
