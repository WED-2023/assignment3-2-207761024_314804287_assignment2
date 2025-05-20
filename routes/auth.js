var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/Register", async (req, res, next) => {
  try {
    // Extract user details from the request body
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
    };

    // Check if username already exists in the database
    let users = await DButils.execQuery("SELECT user_name from users");
    if (users.find((x) => x.user_name === user_details.username))
      throw { status: 409, message: "Username already exists." };

    // Hash the password
    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );

    // Insert the new user into the database
    await DButils.execQuery(
      `INSERT INTO users (user_name, first_name, last_name, country, password, email) VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}',
      '${user_details.country}', '${hash_password}', '${user_details.email}')`
    );

    // Send success response
    res
      .status(201)
      .send({ message: "Registration succeeded.", success: true });
  } catch (error) {
    next(error);
  }

});

router.post("/Login", async (req, res, next) => {
  try {
    // check that username exists
    const users = await DButils.execQuery('SELECT user_name FROM users');
    if (!users.find((x) => x.user_name === req.body.username))
      throw { status: 401, message: "Username incorrect" };

    // check that the password is correct
    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE user_name = '${req.body.username}'`
      )
    )[0];

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Password incorrect" };
    }
    console.log("password found");

    // Set cookie
    req.session.user_id = user.user_id;
    console.log("session user_id login: " + req.session.user_id);

    // return cookie
    res.status(200).send({ message: "login succeeded " , success: true });
  } catch (error) {
    next(error);
  }
});

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