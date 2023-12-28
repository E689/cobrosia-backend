const Users = require("../models/users");

exports.createUser = (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({
      message: "Missing parameters. Please enter email, name, and password.",
    });
  }

  Users.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({
          message: "Email is already registered. Please use a different email.",
        });
      }
      const newUser = new Users({ email, name, password });

      newUser
        .save()
        .then((newUser) => {
          return res.status(201).json({
            message: "User created",
            user: { name: newUser.name, id: newUser._id },
          });
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).json({
            error,
            message: "Error creating user",
          });
        });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error,
        message: "Error checking for existing email",
      });
    });
};

exports.logUser = (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  console.log(JSON.parse(req.body));
  Users.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        console.log("user not found");
        return res.status(400).json({
          error: "User with that email does not exist. Please register first.",
        });
      }
      // authenticate
      if (!foundUser.authenticate(password)) {
        console.log("worng password");
        return res.status(400).json({
          error: "Incorrect password",
        });
      }

      // here i would generate a token for the user
      // and send it back
      console.log("sign in user", foundUser);
      return res.status(200).json({
        message: "User logged in succesfully",
        user: { name: foundUser.name, id: foundUser._id },
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: `Please try again.`,
      });
    });
};
