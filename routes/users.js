const express = require("express");
const router = express.Router();

const {
  createUser,
  logUser,
  activateUser,
  resetPassword,
  forgotPassword,
} = require("../controllers/users");

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
router.post("/users/register", createUser);

router.post("/users/register/activate", activateUser);

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
router.post("/users/login", logUser);

router.post("/users/reset-password", resetPassword);

router.post("/users/forgot-password", forgotPassword);

module.exports = router;
