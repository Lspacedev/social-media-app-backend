const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const supabase = require("../config/supabase");
const { decode } = require("base64-arraybuffer");
const { v4: uuidv4 } = require("uuid");

//validation
const { body, validationResult } = require("express-validator");
const { use } = require("passport");

const alphaErr = "must only contain letters.";
const lengthErr = "must be between 1 and 25 characters.";

const commentLengthErr = "must be between 1 and 25 characters.";
const postLengthErr = "must be between 1 and 1600 characters.";

const validatePost = [
  body("text")
    .optional()
    .trim()
    .isLength({ min: 1, max: 1600 })
    .withMessage(`Text ${postLengthErr}`),
];
const validateUpdatePost = [
  body("text")
    .optional()
    .trim()
    .isLength({ min: 1, max: 1600 })
    .withMessage(`Text ${postLengthErr}`),
];

const validateComment = [
  body("commentText")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(`Comment ${commentLengthErr}`),
];
const validateUpdateComment = [
  body("commentText")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(`Comment ${commentLengthErr}`),
];
async function allAuthorPosts(req, res) {
  const { userId } = req.params;
  const posts = await prisma.post.findMany({
    where: {
      authorId: Number(userId),
    },
    include: {
      comments: true,
      likes: true,
    },
  });
  res.send({ posts: posts });
}

const createPost = [
  validatePost,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
      });
    }

    try {
      console.log(req.file);

      const { userId } = req.params;

      const { text } = req.body;
      let postImageUrl = "";
      if (typeof req.file !== "undefined") {
        const fileBase64 = decode(req.file.buffer.toString("base64"));

        const { data, error } = await supabase.storage
          .from("social-media-app")
          .upload(
            `public/${req.user.id}/` + uuidv4() + req.file.originalname,
            fileBase64,
            {
              cacheControl: "5",
              upsert: true,
              contentType: req.file.mimetype,
            }
          );
        if (error) {
          console.log(error);
          return res.status(404).json({ error: error.message });
        } else {
          postImageUrl = supabase.storage
            .from("social-media-app")
            .getPublicUrl(data.path).data.publicUrl;
          console.log({ data, error });
        }
      }

      const post = await prisma.post.create({
        data: {
          text: typeof text === "undefined" ? "" : text,
          imageUrl: postImageUrl,
          author: {
            connect: {
              id: Number(userId),
            },
          },
        },
      });
      const posts = await prisma.post.findMany({
        include: {
          comments: true,
          likes: true,
        },
      });
      req.io.emit("post-created", posts);
      res.send({ message: "Added post" });
    } catch (error) {
      console.log(error);
    }
  },
];

async function getAuthorPost(req, res) {
  //return specific post
  const { postId } = req.params;
  //return specific post
  const post = await prisma.post.findUnique({
    where: {
      id: Number(postId),
    },
    include: {
      comments: true,
      likes: true,
    },
  });
  res.send({ post });
}

const updatePost = [
  validateUpdatePost,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
      });
    }

    try {
      console.log(req.file);

      const { postId } = req.params;
      const { text } = req.body;
      const post = await prisma.post.findUnique({
        where: {
          id: Number(postId),
        },
      });
      let newPost = {};
      let isUpdate = false;

      let postImageUrl = "";
      if (typeof req.file !== "undefined") {
        const fileBase64 = decode(req.file.buffer.toString("base64"));
        const id = uuidv4();
        if (post.imageUrl !== null) {
          const fileToReplace = post.imageUrl.substring(
            post.imageUrl.lastIndexOf("/") + 1
          );

          await supabase.storage
            .from("social-media-app")
            .move(
              `public/${req.user.id}/` + fileToReplace,
              `public/${req.user.id}/` + id + req.file.originalname
            );
        }
        const { data, error } = await supabase.storage
          .from("social-media-app")
          .upload(
            `public/${req.user.id}/` + id + req.file.originalname,
            fileBase64,
            {
              cacheControl: "5",
              upsert: true,
              contentType: req.file.mimetype,
            }
          );
        console.log({ data, error });

        if (error) {
          console.log(error);
          return res.status(404).json({ error: error.message });
        } else {
          postImageUrl = supabase.storage
            .from("social-media-app")
            .getPublicUrl(data.path).data.publicUrl;
          console.log({ data, error });
        }
      }

      if (text !== "") {
        isUpdate = true;
        newPost.text = text;
      }

      if (postImageUrl !== "") {
        isUpdate = true;
        newPost.imageUrl = postImageUrl;
      }

      if (isUpdate) {
        const post = await prisma.post.update({
          where: {
            id: Number(postId),
          },
          data: newPost,
        });
        const posts = await prisma.post.findMany({
          where: {
            authorId: Number(req.user.id),
          },
          include: {
            comments: true,
            likes: true,
          },
        });

        req.io.emit("post-updated", posts);
        res.send({ message: "Updated successfully" });
      } else {
        res.send({ message: "Nothing to update" });
      }
    } catch (error) {
      console.log(error);
    }
  },
];

async function deletePost(req, res) {
  const { postId } = req.params;

  const likesdelete = await prisma.like.deleteMany({
    where: {
      postId: Number(postId),
    },
  });
  const commentdelete = await prisma.comment.deleteMany({
    where: {
      postId: Number(postId),
    },
  });
  const post = await prisma.post.findUnique({
    where: {
      id: Number(postId),
    },
  });
  console.log(post);
  if (post.imageUrl !== null) {
    const filename = post.imageUrl.substring(
      post.imageUrl.lastIndexOf("/") + 1
    );
    console.log({ filename });

    const { data, error } = await supabase.storage
      .from("social-media-app")
      .remove([`public/${req.user.id}/` + filename]);
  }
  const postdelete = await prisma.post.delete({
    where: {
      id: Number(postId),
    },
  });
  const posts = await prisma.post.findMany({
    where: {
      authorId: Number(req.user.id),
    },
    include: {
      comments: true,
      likes: true,
    },
  });
  const likedPosts = await prisma.like.findMany({
    where: {
      likedById: req.user.id,
    },
    include: {
      post: {
        include: {
          comments: true,
          likes: true,
        },
      },
    },
  });
  req.io.emit("post-updated", posts);
  req.io.emit("liked-posts-updated", likedPosts);

  res.send({ message: "Deleted successfully" });
}

const addComment = [
  validateComment,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
      });
    }
    const { userId, postId } = req.params;
    console.log(userId, req.user.id);
    const { commentText } = req.body;
    //return all pub & unpub posts from author
    const comment = await prisma.comment.create({
      data: {
        commentText: commentText,
        post: {
          connect: {
            id: Number(postId),
          },
        },
        author: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });
    const post = await prisma.post.findUnique({
      where: {
        id: Number(postId),
      },
      include: {
        comments: true,
        likes: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
      include: {
        followedBy: true,
        following: true,
        notifications: true,
      },
    });
    if (user.notifications.length < 15 && Number(userId) !== req.user.id) {
      const notification = await prisma.notification.create({
        data: {
          user: {
            connect: {
              id: Number(userId),
            },
          },
          message: `${req.user.username} commented on your post.`,
        },
      });
      const user = await prisma.user.findUnique({
        where: {
          id: Number(userId),
        },
        include: {
          followedBy: true,
          following: true,
          notifications: true,
        },
      });
      req.io.emit("notifications-updated", user);
    }
    req.io.emit("updated-comment", post);

    res.send({ message: "Added comment" });
  },
];
const updateComment = [
  validateUpdateComment,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
      });
    }
    const { postId, commentId } = req.params;
    const { commentText } = req.body;
    if (commentText !== "") {
      const comment = await prisma.comment.update({
        where: {
          id: Number(commentId),
        },
        data: {
          commentText: commentText,
        },
      });
      const post = await prisma.post.findUnique({
        where: {
          id: Number(postId),
        },
        include: {
          comments: true,
          likes: true,
        },
      });
      req.io.emit("updated-comment", post);
      res.send({ message: "Updated successfully" });
    } else {
      res.send({ message: "Nothing to update" });
    }
  },
];
async function getComments(req, res) {
  const { postId } = req.params;
  const comments = await prisma.comment.findMany({
    where: {
      postId: Number(postId),
    },
  });
  res.send({ comments: comments });
}
async function getComment(req, res) {
  const { commentId } = req.params;
  const comment = await prisma.comment.findUnique({
    where: {
      id: Number(commentId),
    },
  });
  res.send(comment);
}

async function deleteComment(req, res) {
  const { postId, commentId } = req.params;
  const postdelete = await prisma.comment.delete({
    where: {
      id: Number(commentId),
    },
  });
  const post = await prisma.post.findUnique({
    where: {
      id: Number(postId),
    },
    include: {
      comments: true,
      likes: true,
    },
  });
  req.io.emit("updated-comment", post);
  res.send({ message: "Comment deleted successfully" });
}

async function likePost(req, res) {
  try {
    req.io.emit("test", { con: true });

    const { userId, postId } = req.params;
    const findLike = await prisma.like.findUnique({
      where: {
        likedById_postId: {
          likedById: req.user.id,
          postId: Number(postId),
        },
      },
    });
    if (findLike === null) {
      const like = await prisma.like.create({
        data: {
          post: {
            connect: {
              id: Number(postId),
            },
          },
          likedBy: {
            connect: {
              id: req.user.id,
            },
          },
        },
      });
      const feedPosts = await prisma.post.findMany({
        include: {
          comments: true,
          likes: true,
        },
      });
      req.io.emit("feed-likes-updated", feedPosts);

      const post = await prisma.post.findUnique({
        where: {
          id: Number(postId),
        },
        include: {
          comments: true,
          likes: true,
        },
      });
      const profilePosts = await prisma.post.findMany({
        where: {
          authorId: req.user.id,
        },
        include: {
          comments: true,
          likes: true,
        },
      });
      const targetProfilePosts = await prisma.post.findMany({
        where: {
          authorId: Number(userId),
        },
        include: {
          comments: true,
          likes: true,
        },
      });

      const likedPosts = await prisma.like.findMany({
        where: {
          likedById: req.user.id,
        },
        include: {
          post: {
            include: {
              comments: true,
              likes: true,
            },
          },
        },
      });
      const targetLikedPosts = await prisma.like.findMany({
        where: {
          likedById: Number(userId),
        },
        include: {
          post: {
            include: {
              comments: true,
              likes: true,
            },
          },
        },
      });

      const followings = await prisma.follows.findMany({
        where: {
          OR: [
            {
              followedById: req.user.id,
            },
          ],
        },
        include: {
          following: true,
        },
      });

      let followingPosts = [];

      await Promise.all(
        followings.map(async (following) => {
          const arr = await prisma.post.findMany({
            where: {
              authorId: following.followingId,
            },
            include: {
              comments: true,
              likes: true,
            },
          });
          followingPosts = followingPosts.concat(arr);
        })
      );

      const user = await prisma.user.findUnique({
        where: {
          id: Number(userId),
        },
        include: {
          followedBy: true,
          following: true,
          notifications: true,
        },
      });
      if (user.notifications.length < 15 && Number(userId) !== req.user.id) {
        const notification = await prisma.notification.create({
          data: {
            user: {
              connect: {
                id: Number(userId),
              },
            },
            message: `${req.user.username} is liked your post.`,
          },
        });

        const user = await prisma.user.findUnique({
          where: {
            id: Number(userId),
          },
          include: {
            followedBy: true,
            following: true,
            notifications: true,
          },
        });
        req.io.emit("notifications-updated", user);
      }
      req.io.emit("following-likes-updated", followingPosts);

      req.io.emit("profile-likes-updated", profilePosts);
      req.io.emit("liked-posts-updated", likedPosts);
      req.io.emit("target-profile-likes-updated", targetProfilePosts);
      req.io.emit("target-liked-posts-updated", targetLikedPosts);
      req.io.emit("like-updated", post);
      res.send({ message: "Added like" });
    } else {
      res.send({ message: "Like exists" });
    }
  } catch (error) {
    console.log(error);
  }
}
async function unlikePost(req, res) {
  try {
    const { userId, postId, likeId } = req.params;
    console.log(postId, likeId);

    const findLike = await prisma.like.findUnique({
      where: {
        likedById_postId: {
          likedById: req.user.id,
          postId: Number(postId),
        },
      },
    });

    if (findLike !== null) {
      const postdelete = await prisma.like.delete({
        where: {
          likedById_postId: {
            likedById: req.user.id,
            postId: Number(postId),
          },
        },
      });
      const feedPosts = await prisma.post.findMany({
        include: {
          comments: true,
          likes: true,
        },
      });
      req.io.emit("feed-likes-updated", feedPosts);

      const post = await prisma.post.findUnique({
        where: {
          id: Number(postId),
        },
        include: {
          comments: true,
          likes: true,
        },
      });
      const profilePosts = await prisma.post.findMany({
        where: {
          authorId: req.user.id,
        },
        include: {
          comments: true,
          likes: true,
        },
      });
      const targetProfilePosts = await prisma.post.findMany({
        where: {
          authorId: Number(userId),
        },
        include: {
          comments: true,
          likes: true,
        },
      });

      const likedPosts = await prisma.like.findMany({
        where: {
          likedById: req.user.id,
        },
        include: {
          post: {
            include: {
              comments: true,
              likes: true,
            },
          },
        },
      });
      const targetLikedPosts = await prisma.like.findMany({
        where: {
          likedById: Number(userId),
        },
        include: {
          post: {
            include: {
              comments: true,
              likes: true,
            },
          },
        },
      });
      const followings = await prisma.follows.findMany({
        where: {
          OR: [
            {
              followedById: req.user.id,
            },
          ],
        },
        include: {
          following: true,
        },
      });

      let followingPosts = [];

      await Promise.all(
        followings.map(async (following) => {
          const arr = await prisma.post.findMany({
            where: {
              authorId: following.followingId,
            },
            include: {
              comments: true,
              likes: true,
            },
          });
          followingPosts = followingPosts.concat(arr);
        })
      );
      req.io.emit("following-likes-updated", followingPosts);

      req.io.emit("profile-likes-updated", profilePosts);
      req.io.emit("liked-posts-updated", likedPosts);
      req.io.emit("target-profile-likes-updated", targetProfilePosts);
      req.io.emit("target-liked-posts-updated", targetLikedPosts);
      req.io.emit("like-updated", post);
      res.send({ message: "Like deleted successfully" });
    } else {
      res.send({ message: "Like doesn't exist" });
    }
  } catch (error) {
    console.log(error);
  }
}
async function publishPost(req, res) {
  const { postId } = req.params;
  const { publish } = req.body;

  const post = await prisma.post.update({
    where: {
      id: Number(postId),
    },
    data: {
      published: publish,
    },
  });
  res.send({ message: "Published Post" });
}
async function unpublishPost(req, res) {
  const { postId } = req.params;
  const { publish } = req.body;

  const post = await prisma.post.update({
    where: {
      id: Number(postId),
    },
    data: {
      published: publish,
    },
  });
  res.send({ message: "Unpublished Post" });
}

module.exports = {
  allAuthorPosts,
  createPost,
  getAuthorPost,
  updatePost,
  deletePost,
  getComments,
  getComment,
  addComment,
  updateComment,
  deleteComment,
  likePost,
  unlikePost,
};
