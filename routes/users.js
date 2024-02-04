const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  createUser,
  logUser,
  activateUser,
  resetPassword,
  forgotPassword,
  createUserFromEmail,
  changePassword,
} = require("../controllers/users");

const { fileController } = require("../utils/utilityFile");

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

router.post("/register", createUserFromEmail);

router.post("/users/register/activate", activateUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in user
 *     description: Verify and log a user.
 *     tags:
 *       - Users
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: userCredentials
 *         description: User credentials for login.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               description: Email of the user.
 *             password:
 *               type: string
 *               description: Plain password to verify with the saved hashed password.
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
 */
router.post("/users/login", logUser);

router.post("/users/reset-password", resetPassword);
/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: change password
 *     description: Verify and log a user.
 *     tags:
 *       - Users
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: userCredentials
 *         description: User credentials for login.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               description: Email of the user.
 *             password:
 *               type: string
 *               description: Plain password to verify with the saved hashed password.
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
 */
router.post("/users/change-password", changePassword);

router.post("/users/forgot-password", forgotPassword);

/**
 * @swagger
 * /users/register/file:
 *   post:
 *     summary: create user with user and file
 *     description: send an email and a csv or xlx to create a new user
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
router.post("/users/register/file", upload.single("file"), fileController);

module.exports = router;
