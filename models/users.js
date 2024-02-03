const mongoose = require("mongoose");
const crypto = require("crypto");

const usersSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      max: 32,
    },
    hashed_password: {
      type: String,
    },
    salt: String,
    key: {
      type: String,
    },
    resetPasswordLink: {
      type: String,
      default: "",
    },
    type: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// virtual fields
usersSchema
  .virtual("password")
  .set(function (password) {
    // create temp variable called _password
    this._password = password;
    // generate salt
    this.salt = this.makeSalt();
    // encrypt password
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

// methods > authenticate, encryptPassword, makeSalt
usersSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },

  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  },
};
// export user model

module.exports = mongoose.model("Users", usersSchema);
