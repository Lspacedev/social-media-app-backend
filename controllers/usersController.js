const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const supabase = require("../config/supabase");
const { decode } = require("base64-arraybuffer");
const { v4: uuidv4 } = require("uuid");
//validation
const { body, validationResult } = require("express-validator");
const { connect } = require("../routes/indexRouter");

const alphaErr = "must only contain letters.";
const lengthErr = "must be between 1 and 25 characters.";

const validateUser = [
  body("username")
    .trim()
    .isLength({ min: 1, max: 1600 })
    .withMessage(`Username ${lengthErr}`),
];

const validateUpdateUser = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 1, max: 1600 })
    .withMessage(`Username ${lengthErr}`),
];
const validateMessage = [
  body("text")
    .trim()
    .isLength({ min: 1, max: 1600 })
    .withMessage(`Text ${lengthErr}`),
];
async function allUsers(req, res) {
  //return all users
  try {
    const users = await prisma.user.findMany({});
    res.status(201).json({ users: users });
  } catch (error) {
    res.status(404).json({ error: "Users not found" });
  }
}

async function getUser(req, res) {
  try {
    const { userId } = req.params;
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

    res.status(201).json({ user: user });
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
}

const updateUser = [
  validateUpdateUser,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.json({
        errors: errors.array(),
      });
    }
    try {
      const reqUser = req.user;
      const { username } = req.body;
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
      });
      let profileImage;
      let coverImage;
      if (typeof req.files !== "undefined") {
        req.files.map((file) => {
          console.log(
            file.originalname.substring(0, file.originalname.indexOf("."))
          );
          if (
            file.originalname.substring(0, file.originalname.indexOf(".")) ===
            "profilePic"
          ) {
            profileImage = file;
          }
          if (
            file.originalname.substring(0, file.originalname.indexOf(".")) ===
            "cover"
          ) {
            coverImage = file;
          }
        });
      }
      let newUser = {};
      let isUpdate = false;
      if (username !== "") {
        newUser.username = username;
        isUpdate = true;
      }
      if (typeof profileImage !== "undefined") {
        if (user.profileUrl === "" || user.profileUrl === null) {
          isUpdate = true;
          const fileBase64 = decode(profileImage.buffer.toString("base64"));

          const { data, error } = await supabase.storage
            .from("social-media-app")
            .upload(
              `public/${req.user.id}/` + uuidv4() + profileImage.originalname,
              fileBase64,
              {
                cacheControl: "2",
                upsert: true,
                contentType: profileImage.mimetype,
              }
            );
          if (error) {
            return res.status(404).json({ error: error.message });
          } else {
            newUser.profileUrl = supabase.storage
              .from("social-media-app")
              .getPublicUrl(data.path).data.publicUrl;
          }
        } else {
          isUpdate = true;
          const fileBase64 = decode(profileImage.buffer.toString("base64"));
          const fileToReplace = user.profileUrl.substring(
            user.profileUrl.lastIndexOf("/") + 1
          );
          const id = uuidv4();
          const { error } = await supabase.storage
            .from("social-media-app")
            .move(
              `public/${req.user.id}/` + fileToReplace,
              `public/${req.user.id}/` + id + profileImage.originalname
            );
          const { data } = await supabase.storage
            .from("social-media-app")
            .update(
              `public/${req.user.id}/` + id + profileImage.originalname,
              fileBase64,
              {
                cacheControl: "2",
                upsert: true,
                contentType: profileImage.mimetype,
              }
            );

          if (error) {
            console.log(error);
            return res.status(404).json({ error: error.message });
          } else {
            newUser.profileUrl = supabase.storage
              .from("social-media-app")
              .getPublicUrl(data.path).data.publicUrl;
          }
        }
      }
      if (typeof coverImage !== "undefined") {
        if (user.coverUrl === "" || user.coverUrl === null) {
          isUpdate = true;
          const fileBase64 = decode(coverImage.buffer.toString("base64"));

          const { data, error } = await supabase.storage
            .from("social-media-app")
            .upload(
              `public/${req.user.id}/` + uuidv4() + coverImage.originalname,
              fileBase64,
              {
                cacheControl: "2",
                upsert: true,
                contentType: coverImage.mimetype,
              }
            );

          if (error) {
            return res.status(404).json({ error: error.message });
          } else {
            newUser.coverUrl = supabase.storage
              .from("social-media-app")
              .getPublicUrl(data.path).data.publicUrl;
          }
        } else {
          isUpdate = true;
          const fileBase64 = decode(coverImage.buffer.toString("base64"));
          const fileToReplace = user.coverUrl.substring(
            user.coverUrl.lastIndexOf("/") + 1
          );
          const id = uuidv4();

          const { error } = await supabase.storage
            .from("social-media-app")
            .move(
              `public/${req.user.id}/` + fileToReplace,
              `public/${req.user.id}/` + id + coverImage.originalname
            );
          console.log({ fileToReplace }, coverImage.originalname);

          const { data } = await supabase.storage
            .from("social-media-app")
            .update(
              `public/${req.user.id}/` + id + coverImage.originalname,
              fileBase64,
              {
                cacheControl: "2",
                upsert: true,
                contentType: coverImage.mimetype,
              }
            );
          if (error) {
            console.log(error);
            return res.status(404).json({ error: error.message });
          } else {
            newUser.coverUrl = supabase.storage
              .from("social-media-app")
              .getPublicUrl(data.path).data.publicUrl;
            console.log({ data, error });
          }
        }
      }

      if (isUpdate) {
        const user = await prisma.user.update({
          where: {
            id: req.user.id,
          },
          data: newUser,
        });
        const userUpdate = await prisma.user.findUnique({
          where: {
            id: req.user.id,
          },
          include: {
            followedBy: true,
            following: true,
          },
        });
        req.io.emit("profile-update", userUpdate);
        res.status(201).json({ message: "Updated user" });
      } else {
        res.status(404).json({ message: "Nothing to update" });
      }
    } catch (error) {
      console.log(error);
      res.status(404).json({ error: "Failed to update user" });
    }
  },
];

async function getAllPosts(req, res) {
  const { userId } = req.params;
  const posts = await prisma.post.findMany({
    include: {
      comments: true,
      likes: true,
    },
  });
  res.send({ posts: posts });
}
async function getFollowingPosts(req, res) {
  const { userId } = req.params;

  const followings = await prisma.follows.findMany({
    where: {
      OR: [
        {
          followedById: Number(userId),
        },
      ],
    },
    include: {
      following: true,
    },
  });

  let posts = [];

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
      posts = posts.concat(arr);
    })
  );

  res.send({ posts: posts });
}
async function getLikedPosts(req, res) {
  try {
    const { userId } = req.params;

    const likedPosts = await prisma.like.findMany({
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
    console.log({ likedPosts });
    res.status(201).json({ likedPosts });
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "Likes not found" });
  }
}
async function getFollowers(req, res) {
  try {
    // user's followers
    const { userId } = req.params;

    const followers = await prisma.follows.findMany({
      where: {
        OR: [
          {
            followingId: Number(userId),
          },
        ],
      },
      include: {
        followedBy: true,
      },
    });
    res.status(201).json({ followers });
  } catch (error) {
    res.status(404).json({ error: "Failed to get followers" });
  }
}
async function getFollowing(req, res) {
  try {
    // user's following
    const { userId } = req.params;

    const following = await prisma.follows.findMany({
      where: {
        OR: [
          {
            followedById: Number(userId),
          },
        ],
      },
      include: {
        following: true,
      },
    });
    res.status(201).json({ following });
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "Failed to get following" });
  }
}

async function follow(req, res) {
  try {
    // user's following
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      include: {
        followedBy: true,
        following: true,
        notifications: true,
      },
    });

    const filterFollowing = user.following.filter(
      (accountId) => accountId == userId
    );

    if (filterFollowing.length === 0) {
      const following = await prisma.follows.create({
        data: {
          followedBy: {
            connect: {
              id: req.user.id,
            },
          },
          // followedById: req.user.id,

          following: {
            connect: {
              id: Number(userId),
            },
          },
          // followingId: Number(userId),
        },
      });

      const userFollowing = await prisma.follows.findMany({
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
      const targetUserFollowers = await prisma.follows.findMany({
        where: {
          OR: [
            {
              followingId: Number(userId),
            },
          ],
        },
        include: {
          followedBy: true,
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
      if (user.notifications.length < 15) {
        const notification = await prisma.notification.create({
          data: {
            user: {
              connect: {
                id: Number(userId),
              },
            },
            message: `${req.user.username} is now following.`,
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
      const userUpdate = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
        include: {
          followedBy: true,
          following: true,
          notifications: true,
        },
      });

      req.io.emit("logged-profile-follow-update", userUpdate);
      req.io.emit("target-profile-follow-update", user);

      req.io.emit("following-updated", {
        id: req.user.id,
        following: userFollowing,
      });
      req.io.emit("followers-updated", {
        id: Number(userId),
        followers: targetUserFollowers,
      });

      res.status(201).json({ following });
    } else {
      res.status(201).json({ message: "Already following user" });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "Failed to add following" + error.message });
  }
}

async function unfollow(req, res) {
  try {
    // user's following
    const { userId } = req.params;
    const following = await prisma.follows.findMany({
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

    const filterFollowing = following.filter(
      (obj) => obj.followingId === Number(userId)
    );

    if (filterFollowing.length > 0) {
      const followdelete = await prisma.follows.delete({
        where: {
          followingId_followedById: {
            followingId: Number(userId),
            followedById: req.user.id,
          },
        },
      });
      const userFollowing = await prisma.follows.findMany({
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
      const targetUserFollowers = await prisma.follows.findMany({
        where: {
          OR: [
            {
              followingId: Number(userId),
            },
          ],
        },
        include: {
          followedBy: true,
        },
      });
      const userUpdate = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
        include: {
          followedBy: true,
          following: true,
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
      req.io.emit("logged-profile-follow-update", userUpdate);
      req.io.emit("target-profile-follow-update", user);

      req.io.emit("following-updated", {
        id: req.user.id,
        following: userFollowing,
      });
      req.io.emit("followers-updated", {
        id: Number(userId),
        followers: targetUserFollowers,
      });
      res.status(201).json(followdelete);
    } else {
      res.status(201).json({ message: "Not following user" });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "Failed to add following" });
  }
}
async function getUserMessages(req, res) {
  try {
    // all users
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
      include: {
        sentMessages: true,
        recievedMessages: true,
      },
    });
    res
      .status(201)
      .json({ messages: user.sentMessages.concat(user.recievedMessages) });
  } catch (error) {
    res.status(404).json({ error: "Failed to get messages" });
  }
}

async function postUserMessages(req, res) {
  try {
    // user's friends

    const user = req.user;
    const { userId } = req.params;
    //check if message instance exists
    const recieverMessages = await prisma.message.findFirst({
      where: {
        senderId: req.user.id,
        receiverId: Number(userId),
      },
      include: {
        replies: true,
      },
    });
    const senderMessages = await prisma.message.findFirst({
      where: {
        senderId: Number(userId),
        receiverId: req.user.id,
      },
      include: {
        replies: true,
      },
    });

    if (recieverMessages === null && senderMessages === null) {
      const recieverUser = await prisma.user.findUnique({
        where: {
          id: Number(userId),
        },
      });
      const message = await prisma.message.create({
        data: {
          senderUsername: req.user.username,
          receiverUsername: recieverUser.username,
          sender: {
            connect: {
              id: req.user.id,
            },
          },
          receiver: {
            connect: {
              id: Number(userId),
            },
          },
        },
      });

      const user = await prisma.user.findUnique({
        where: {
          id: Number(userId),
        },
        include: {
          sentMessages: true,
          recievedMessages: true,
        },
      });

      const messages = user.sentMessages.concat(user.recievedMessages);
      res.status(201).send({ id: message.id });
    } else {
      res.status(201).send({
        id: senderMessages === null ? recieverMessages.id : senderMessages.id,
      });
    }
  } catch (error) {
    res.status(404).json({ error: "Failed to add message" });
  }
}

async function getMessageById(req, res) {
  try {
    // all users
    const { messageId } = req.params;
    const message = await prisma.message.findFirst({
      where: {
        id: Number(messageId),
      },
      include: {
        replies: true,
      },
    });
    if (message === null) {
      res.status(201).json({ message: [] });
    } else {
      res.status(201).json({ message: message });
    }
  } catch (error) {
    res.status(404).json({ error: "Failed to get message" });
  }
}
async function postReplyToMessage(req, res) {
  try {
    // user's friends
    const user = req.user;

    const { messageId } = req.params;

    const { text } = req.body;
    const reply = await prisma.reply.create({
      data: {
        text: text,
        message: {
          connect: {
            id: Number(messageId),
          },
        },
        authorId: user.id,
      },
    });
    const message = await prisma.message.findFirst({
      where: {
        id: Number(messageId),
      },
      include: {
        replies: true,
      },
    });
    req.io.emit("reply-added", message);

    res.status(201).json({ message: "Reply sent" });
  } catch (error) {
    res.status(404).json({ error: "Failed to post reply" });
  }
}
async function deleteNotification(req, res) {
  try {
    const { userId, notificationId } = req.params;

    const notificationDelete = await prisma.notification.delete({
      where: {
        id: Number(notificationId),
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

    res.status(201).json({ message: "Notification deleted" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "Notification not found" });
  }
}

module.exports = {
  allUsers,
  getUser,
  getAllPosts,
  getFollowingPosts,
  getLikedPosts,
  updateUser,
  getFollowing,
  getFollowers,
  follow,
  unfollow,
  getUserMessages,
  postUserMessages,
  getMessageById,
  postReplyToMessage,
  deleteNotification,
};
