var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipes_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


// ==================================Last Viewed Recipes=========================================
router.post("/LastViewedRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.updateLastViewed(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as LastViwed");
  } catch (error) {
    next(error); 
  }
});


router.get("/LastViewedRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getLastViewedRecipes(user_id);
    const results = await recipes_utils.getRecipesPreview(recipes_id);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

router.get("/IsLastViewedRecipe", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipe_id = req.query.recipeId;
    const recipes_id = await user_utils.getAllLastViewedRecipes(user_id);
    const isLastViewed = recipes_id.some((id) => String(id) === recipe_id);

    res.status(200).send({ isLastViewed });
  } catch (error) {
    next(error);
  }
});

// ==================================Last Viewed Recipes=========================================

// ===================================Favorites Recipes=========================================
/**
 * Adds a recipe to the favorites list of the logged-in user.
 * Endpoint: POST /FavoritesRecipes
 * Body Parameters: recipeId (ID of the recipe to be added to favorites)
 * Response: Success or failure message.
 */
router.post("/FavoritesRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }

    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");

  } 
  catch (error) {
    next(error);
  }
});

/**
 * Retrieves the favorite recipe's list saved by the logged-in user.
 * Endpoint: GET /FavoritesRecipes
 * Response: A List of favorite recipes.
 */
router.get("/FavoritesRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    if (recipes_id.length === 0) {
      return res.status(200).send([]); 
    }
    const results = await recipes_utils.getRecipesPreview(recipes_id);
    res.status(200).send(results);
  } 
  catch (error) {
    console.log("error = ",error.message);
    next(error);
  }
});

/**
 * Removes a recipe from the favorites list of the logged-in user.
 * Endpoint: DELETE /FavoritesRecipes
 * Body Parameters: recipeId (ID of the recipe that is to be removed from favorites)
 * Response: Success or failure message.
 */
router.delete("/FavoritesRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.removeFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe was successfully removed from favorites");
  } catch (error) {
    next(error);
  }
});
// ===================================Favorites Recipes=========================================

// ====================================ADD NEW RECIPE & Get Recipes========================================================
router.post("/addNewRecipe", async (req, res, next) => {
  try {

    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }

    if (
      !req.body.title ||
      !Array.isArray(req.body.ingredients) || req.body.ingredients.length === 0 ||
      !Array.isArray(req.body.instructions) || req.body.instructions.length === 0
    ) {
      throw { status: 400, message: "Invalid input: Missing or empty required fields." };
    }

    let recipe_details = {
      user_id: req.session.user_id,
      title: req.body.title,
      image: req.body.image,
      ready_in_minutes: req.body.ready_in_minutes,
      summary: req.body.summary,
      servings: req.body.servings,
      vegan: req.body.vegan,
      vegetarian: req.body.vegetarian,
      is_gluten_free: req.body.is_gluten_free,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
    };
    console.log("recipe_details.instructions = ", recipe_details.instructions);
    recipe_id = await user_utils.addNewRecipe(recipe_details);
    res.status(201).send({
      message: "Recipe has been created successfully.",
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/MyRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "The User is not logged in." };
    }
    const user_id = req.session.user_id;
    const myRecipes_id = await user_utils.getMyRecipes(user_id);
    if (myRecipes_id.length === 0) {
      return res.status(200).send([]); 
    }
    const results = await recipes_utils.getRecipesPreview(myRecipes_id);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

// ====================================ADD NEW RECIPE & Get Recipes========================================================

// ====================================Family Recipes========================================================

router.post("/FamilyRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id)
      throw { status: 401, message: "No User Logged in." };

    const { recipeId, familyMember, relation, inventor, bestEvent, tips, howTo } = req.body;
    if (
      !recipeId ||
      !familyMember ||
      !relation ||
      !inventor ||
      !bestEvent ||
      !tips ||
      !howTo
    ) {
      throw { status: 400, message: "Invalid input: Missing required fields." };
    }

    await user_utils.addFamilyRecipe(
      req.session.user_id,
      recipeId,
      familyMember,
      relation,
      inventor,
      bestEvent,
      tips,
      howTo
    );

    res.status(201).send({ message: "Family recipe added successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/FamilyRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id)
      throw { status: 401, message: "No User Logged in." };

    const recipes = await user_utils.getFamilyRecipes(req.session.user_id);
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});


// ====================================Family Recipes========================================================




module.exports = router;
