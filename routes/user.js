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
    if (recipes_id.length == 0) {
      throw { status: 203, message: "This user has no favorite Recipes ." };
    }
    res.status(200).send(recipes_id);
  } 
  catch (error) {
    console.log("2.3 user.js - line 129 get(/FavoritesRecipes) error = ",error.message);
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

// ====================================MyRecipes===========================================================================
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
// ====================================MyRecipes===========================================================================

//==================================MyMeal=================================================================================


/**
 * Retrieves the recipes in the user's meal.
 * Endpoint: GET /MyMeal
 * Response: List of recipes in the user's meal.
 */

router.get("/MyMeal", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    console.log("user_id = ", user_id);
    const recipes_info = await user_utils.getMyMealRecipes(user_id);
    if (recipes_info.length == 0) {
      throw { status: 203, message: "This user has no recipes in his meal." };
    }
    const recipes_id = recipes_info
    .filter((recipe) => !(recipe.recipeId === 'undefined' && recipe.externalRecipeId === 'undefined'))
    .map((recipe) => {
      return recipe.recipe_id;
    });

    // Get the recipe previews
    const recipePreviews = await recipe_utils.getRecipesPreview(recipes_id);

    // Merge recipe progress into the recipe previews
    const results = await user_utils.fetchRecipeProgress(
      recipes_info,
      recipePreviews
    );
    res.status(200).send(results);
  }
   catch (error) {
    next(error);
  }
});

/**
 * Adds a recipe to the user's meal.
 * Endpoint: POST /MyMeal
 * Body Parameters: recipeId (ID of the recipe to be added to the meal)
 * Response: Success or failure message.
 */

router.post("/MyMeal", async (req, res, next) => {
  try {
    console.log("1");
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    console.log("2");
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    console.log("3");
    console.log("user id = ", user_id, " recipe_id= ", recipe_id);
    await user_utils.addToMyMeal(user_id, recipe_id);
    console.log("4");
    res.status(200).send("The Recipe successfully add to user meal.");
    console.log("5");
  }
   catch (error) {
    next(error);
  }
});

/**
 * Updates the order of recipes in the user's meal.
 * Endpoint: PUT /MyMeal
 * Body Parameters: recipes_order_id (An Array of recipe IDs representing the new order)
 * Response: Success or failure message.
 */

router.put("/MyMeal", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipes_order_id = req.body.recipes_order_id;
    console.log("recipes_order_id = ", recipes_order_id);
    const recipes_info = await user_utils.getMyMealRecipes(user_id);
    console.log("recipes_info = ", recipes_info);
    for (recipe of recipes_info)
      await user_utils.removeFromMyMeal(user_id, recipe.recipe_id);
    for (const recipe_id of recipes_order_id) {
      const matchingRecipe = recipes_info.find(
        (recipe) => recipe.recipe_id == recipe_id
      );
      if (matchingRecipe) {
        console.log('Found matching recipe: ${JSON.stringify(matchingRecipe)}');
        // Add the recipe to table again
        await user_utils.addToMyMeal(user_id, recipe_id);
        // Save progress for the recipe
        const recipe_progress = matchingRecipe.recipe_progress;
        await user_utils.updateRecipeProgressInMyMeal(
          user_id,
          recipe_id,
          recipe_progress
        );
        console.log('Recipe ID: ${recipe_id}, Progress: ${recipe_progress}');
      } else {
        console.log('No matching recipe found for recipe ID: ${recipe_id}');
        throw {
          status: 401,
          message: "No matching recipe found for recipe ID.",
        };
      }
    }
    res.status(200).send("The Recipes successfully reordered.");
  }
   catch (error) {
    next(error);
  }
});

/**
 * Removes a recipe from the user's meal.
 * Endpoint: DELETE /MyMeal
 * Body Parameters: recipeId (ID of the recipe to be removed from the meal)
 * Response: Success or failure message.
 */

router.delete("/MyMeal", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.removeFromMyMeal(user_id, recipe_id);
    res.status(200).send("The Recipe successfully removed from user meal");
  }
   catch (error) {
    next(error);
  }
});


//========================================MyMeal=================================



// ====================================ADD NEW RECIPE & Get Recipes========================================================


















// /**
//  * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
//  */
// router.post('/favorites', async (req,res,next) => {
//   try{
//     const user_id = req.session.user_id;
//     const recipe_id = req.body.recipeId;
//     await user_utils.markAsFavorite(user_id,recipe_id);
//     res.status(200).send("The Recipe successfully saved as favorite");
//     } catch(error){
//     next(error);
//   }
// })

// /**
//  * This path returns the favorites recipes that were saved by the logged-in user
//  */
// router.get('/favorites', async (req,res,next) => {
//   try{
//     const user_id = req.session.user_id;
//     let favorite_recipes = {};
//     const recipes_id = await user_utils.getFavoriteRecipes(user_id);
//     let recipes_id_array = [];
//     recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
//     const results = await recipe_utils.getRecipesPreview(recipes_id_array);
//     res.status(200).send(results);
//   } catch(error){
//     next(error); 
//   }
// });




module.exports = router;
