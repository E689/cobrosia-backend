const Users = require("../models/users");

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Create user
 *     description: Register a new user to the db
 *     tags:
 *       - Users
 *     parameters:
 *       - in: body
 *         name: name
 *         required: true
 *         description: name of new user.
 *         schema:
 *           type: string
 *       - in: body
 *         name: email
 *         required: true
 *         description: unique email of new user.
 *         schema:
 *           type: string
 *       - in: body
 *         name: password
 *         required: true
 *         description: plain password.
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               Users
 *       400:
 *         description: Missing parameters
 *       409:
 *         description: Duplicated email
 *       500:
 *         description: Internal error
 *
 */
exports.createUser = (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({
      message: "Missing parameters. Please enter email, name, and password.",
    });
  }
  /**
   * @swagger
   * /users/login:
   *   post:
   *     summary: Log in user
   *     description: Verify and log a user.
   *     tags:
   *       - Users
   *     parameters:
   *       - in: body
   *         name: email
   *         required: true
   *         description: email of user.
   *         schema:
   *           type: string
   *       - in: body
   *         name: password
   *         required: true
   *         description: plain password to verify with save hash password.
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successful response
   *         content:
   *           application/json:
   *             schema:
   *               Users
   *       400:
   *         description: Missing parameters
   *       500:
   *         description: Internal error
   *
   */
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
  Users.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        return res.status(400).json({
          error: "User with that email does not exist. Please register first.",
        });
      }
      // authenticate
      if (!foundUser.authenticate(password)) {
        return res.status(400).json({
          error: "Incorrect password",
        });
      }

      // here i would generate a token for the user
      // and send it back

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
