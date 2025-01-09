const { Strategy, ExtractJwt } = require("passport-jwt");
const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

require("dotenv").config();

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET; //normally store this in process.env.secret

module.exports = new Strategy(opts, async (jwt_payload, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: jwt_payload.userId },
    });
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, false);
  }
});
