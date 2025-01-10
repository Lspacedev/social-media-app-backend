const express = require("express");
const app = express();
const path = require("node:path");
const passport = require("passport");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");
//define routers
const indexRouter = require("./routes/indexRouter");
const usersRouter = require("./routes/usersRouter");
const postsRouter = require("./routes/postsRouter");

const server = http.createServer(app);

const io = socketIo(server, {
  transports: ["polling"],
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user is connected");

  socket.on("error", (error) => {
    console.log(`${error}`);
  });

  socket.on("disconnect", () => {
    console.log(`socket ${socket.id} disconnected`);
  });
});
app.use((req, res, next) => {
  req.io = io;
  return next();
});

require("dotenv").config();

const jwt = require("jsonwebtoken");

//passport stuff
const jwtStrategry = require("./middleware/jwt");
passport.use(jwtStrategry);

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: false }));

//index routes
app.use("/", indexRouter);

//users route
app.use("/users", usersRouter);

//posts route
app.use("/users/:userId/posts", postsRouter);

const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Express app listening on port ${PORT}!`)
);
