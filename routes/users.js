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
  changePassword,
  createUserWithBill,
} = require("../controllers/users");

const { fileController } = require("../utils/utilityFile");

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Create user with email and password
 *     description: Register a new user to the db
 *     tags:
 *       - Users
 *     parameters:
 *       - in: body
 *         name: data
 *         description: User credentials for login.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       201:
 *         description: Successful user creation
 *         examples:
 *           application/json: { message: "User created", user: {  "name": "newUsersName", "id": "newUsersId"} }
 *       409:
 *         description: Email is already registered
 *         examples:
 *           application/json:
 *             message: "Email is already registered. Please use a different email."
 *       500:
 *         description: Internal error
 *         examples:
 *           application/json: {error : "error description", message: "Error creating user"}
 *
 */
router.post("/users/register", createUser);

/**
 * @swagger
 * /users/register/file:
 *   post:
 *     summary: Register user with file
 *     description: Register a user and process an uploaded file.
 *     tags:
 *       - Users
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: email
 *         type: string
 *         required: true
 *         description: Email of the user.
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Excel or CSV file to process.
 *     responses:
 *       200:
 *         description: File received. Processing started.
 *         examples:
 *           application/json:
 *             message: File received. Processing started.
 *       400:
 *         description: Bad request or unsupported file format.
 *         examples:
 *           application/json:
 *             error: Bad request or unsupported file format.
 *       409:
 *         description: Email is already registered. Please use a different email.
 *         examples:
 *           application/json:
 *             message: Email is already registered. Please use a different email.
 *       500:
 *         description: Internal Server Error
 *         examples:
 *           application/json:
 *             error: Internal Server Error
 */
router.post("/users/register/file", upload.single("file"), fileController);

/**
 * @swagger
 * /users/register/bill:
 *   post:
 *     summary: Register user with bill
 *     description: Register a user with email and bill.
 *     tags:
 *       - Users
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: data
 *         description: User email and bill data.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             billId:
 *               type: string
 *             amount:
 *               type: string
 *             dueDate:
 *               type: string
 *             clientId:
 *               type: string
 *             clientName:
 *               type: string
 *     responses:
 *       201:
 *         description: File received. Processing started.
 *         examples:
 *           application/json:
 *             message: User created. Check email.
 *       400:
 *         description: Missing parameters.
 *         examples:
 *           application/json:
 *             error: Missing parameters.
 *       409:
 *         description: Email is already registered. Please use a different email.
 *         examples:
 *           application/json:
 *             message: Email is already registered. Please use a different email.
 *       500:
 *         description: Internal Server Error
 *         examples:
 *           application/json:
 *             error: Internal Server Error
 *             message: Error creating user, client, or bill.
 */
router.post("/users/register/bill", createUserWithBill);

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
 *             password:
 *               type: string
 *     produces:
 *        - application/json
 *        - text/csv
 *     responses:
 *       200:
 *         description: Successful login
 *         examples:
 *           application/json: { "id": "65bfbc5507b", "jwt": "eyJhbGciOiJIUzI1NiIsiI2NWJmYmM1NTFiOWRiNDVlNmM1N2IiLCJpYXQiOjE3MDcwNjQ4NzAsImV4cJmtsI", "email": "user@mail.com", "type": 0 }
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Internal error
 */
router.post("/users/login", logUser);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Change user password
 *     description: Change the password for a user.
 *     tags:
 *       - Users
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: changePasswordRequest
 *         description: Request object for changing the user's password.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             oldPassword:
 *               type: string
 *             newPassword:
 *               type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         examples:
 *           application/json:
 *             message: Password updated successfully
 *       400:
 *         description: User with that email does not exist or incorrect password.
 *         examples:
 *           application/json:
 *             error: User with that email does not exist or incorrect password.
 *       500:
 *         description: Error updating password or internal server error.
 *         examples:
 *           application/json:
 *             error: Error updating password or internal server error.
 */
router.put("/users/change-password", changePassword);

/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Initiate the password reset process by sending an email with a new password.
 *     tags:
 *       - Users
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: forgotPasswordRequest
 *         description: Request object for initiating password reset.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *     responses:
 *       200:
 *         description: Email sent
 *         examples:
 *           application/json:
 *             message: Email sent
 *       400:
 *         description: Password reset failed or invalid request.
 *         examples:
 *           application/json:
 *             message: Password reset failed or invalid request.
 *       401:
 *         description: User not found.
 *         examples:
 *           application/json:
 *             error: User not found.
 */
router.post("/users/forgot-password", forgotPassword);

router.post("/users/reset-password", resetPassword);

module.exports = router;
