var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");


/** 
  * This route handles user registration.
  * It accepts the following fields in the request body:
  * - username: The desired username for the new user.
  * - firstname: The first name of the user.
  * - lastname: The last name of the user.
  * - country: The country of the user.
  * - password: The desired password for the new user.
  * - email: The email address of the user.
  * It checks if the username already exists in the database.
  * If it does, it throws a 409 error.
  * If the username is available, it hashes the password using bcrypt
  * and inserts the new user into the database.
  * If successful, it returns a 201 status with a success message.
  * @route POST /Register
  * @returns {Object} - A success message indicating registration succeeded.
  * @throws {Object} - Throws a 409 error if the username already exists.
  * @throws {Object} - Throws an error if there is an issue with the database or hashing the password.
*/
router.post("/Register", async (req, res, next) => {
  try {
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
    };

    let users = await DButils.execQuery("SELECT user_name from users");
    if (users.find((x) => x.user_name === user_details.username))
      throw { status: 409, message: "Username already exists." };

    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );

    await DButils.execQuery(
      `INSERT INTO users (user_name, first_name, last_name, country, password, email) VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}',
      '${user_details.country}', '${hash_password}', '${user_details.email}')`
    );

    res
      .status(201)
      .send({ message: "Registration succeeded.", success: true });
  } catch (error) {
    next(error);
  }

});


/**
 * This route handles user login.
 * It accepts the following fields in the request body:
 * - username: The username of the user trying to log in.
 * - password: The password of the user trying to log in.
 * It checks if the username exists in the database.
 * If it does not, it throws a 401 error.
 * If the username exists, it retrieves the user details from the database
 * and compares the provided password with the stored hashed password using bcrypt.
 * If the password is incorrect, it throws a 401 error.
 * If the login is successful, it sets the session user_id to the user's ID
 * and returns a 200 status with a success message.
 * * @route POST /Login
 * * @returns {Object} - A success message indicating login succeeded.
 * * @throws {Object} - Throws a 401 error if the username or password is incorrect.
 * * @throws {Object} - Throws an error if there is an issue with the database or password comparison.
 * */
router.post("/Login", async (req, res, next) => {
  try {
    const users = await DButils.execQuery('SELECT user_name FROM users');
    if (!users.find((x) => x.user_name === req.body.username))
      throw { status: 401, message: "Username incorrect" };

    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE user_name = '${req.body.username}'`
      )
    )[0];

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Password incorrect" };
    }
    console.log("password found");

    req.session.user_id = user.user_id;
    console.log("session user_id login: " + req.session.user_id);

    res.status(200).send({ message: "login succeeded " , success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * This route handles user logout.
 * It checks if the user is logged in by verifying if the session user_id exists.
 * If it does, it resets the session, effectively logging the user out.
 * If the user is not logged in, it throws a 409 error.
 * * @route POST /Logout
 * * @returns {Object} - A success message indicating logout succeeded.
 * * * @throws {Object} - Throws a 409 error if the user is not logged in.
 * */
router.post("/Logout", function (req, res, next) {
  try {
    if (req.session.user_id) {
      req.session.reset(); 
      res.send({ success: true, message: "Logout succeeded." });
    } else {
      throw { status: 409, message: "You are not logged in." };
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;