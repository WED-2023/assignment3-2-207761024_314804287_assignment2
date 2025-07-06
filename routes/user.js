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
/**
  * This route allows users to save a recipe as last viewed.
  * It checks if the user is logged in by verifying the session user_id.
  * If the user is logged in, it retrieves the user_id from the session
  * and the recipe_id from the request body.
  * It then calls the updateLastViewed function from user_utils to save the recipe as last viewed.
  * If successful, it responds with a 200 status and a success message.
  * * @route POST /LastViewedRecipes
  * * @returns {Object} - A success message indicating the recipe was saved as last viewed.
  * * * @throws {Object} - Throws a 401 error if no user is logged in.
  * * * @throws {Object} - Throws an error if there is an issue with saving the recipe as last viewed.
 */
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


/**
 * * This route checks if the user is logged in by verifying the session user_id.
 * If the user is logged in, it retrieves the user_id from the session
 * and calls the getLastViewedRecipes function from user_utils to get the last viewed recipes.
 * It then calls the getRecipesPreview function from recipes_utils to get the preview of those recipes.
 * If successful, it responds with a 200 status and the list of last viewed recipes.
 * * If the user is not logged in, it throws a 401 error with a message indicating that no user is logged in.
 * * If there is an issue with retrieving the last viewed recipes, it throws an error that is passed to the next middleware.
 * * @route GET /LastViewedRecipes
 * * @returns {Array} - An array of last viewed recipes with their previews.
 * * * @throws {Object} - Throws a 401 error if no user is logged in.
 * * * @throws {Object} - Throws an error if there is an issue with retrieving the last viewed recipes.
  */
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


/**
 * * This route checks if a specific recipe is in the user's last viewed recipes.
 * It retrieves the user_id from the session and the recipe_id from the query parameters.
 * It then calls the getAllLastViewedRecipes function from user_utils to get all last viewed recipes for the user.
 * It checks if the recipe_id is present in the list of last viewed recipes.
 * If the recipe_id is found, it responds with a 200 status and an object indicating that the recipe is in the last viewed list.
 * * If the user is not logged in, it throws a 401 error with a message indicating that no user is logged in.
 * * If there is an issue with retrieving the last viewed recipes, it throws an error that is passed to the next middleware.
 * * @route GET /IsLastViewedRecipe
 * * @returns {Object} - An object indicating whether the recipe is in the last viewed list.
 * * * @throws {Object} - Throws a 401 error if no user is logged in.
 * * * @throws {Object} - Throws an error if there is an issue with retrieving the last viewed recipes.
 * */
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
  * This route allows users to mark a recipe as favorite.
  * It checks if the user is logged in by verifying the session user_id.
  * If the user is logged in, it retrieves the user_id from the session
  * and the recipe_id from the request body.
  * It then calls the markAsFavorite function from user_utils to save the recipe as favorite.
  * If successful, it responds with a 200 status and a success message.
  * * @route POST /FavoritesRecipes
  * * @returns {Object} - A success message indicating the recipe was saved as favorite.
  * * * @throws {Object} - Throws a 401 error if no user is logged in.
  * * * @throws {Object} - Throws an error if there is an issue with saving the recipe as favorite.
  * */
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
  * This route allows users to get their favorite recipes.
  * It checks if the user is logged in by verifying the session user_id.
  * If the user is logged in, it retrieves the user_id from the session
  * and calls the getFavoriteRecipes function from user_utils to get the user's favorite recipes.
  * If successful, it responds with a 200 status and the list of favorite recipes.
  * * If the user is not logged in, it throws a 401 error with a message indicating that no user is logged in.
  * * If there are no favorite recipes, it throws a 203 error with a message indicating that the user has no favorite recipes.
  * * @route GET /FavoritesRecipes
  * * @returns {Array} - A list of favorite recipes.
  * * @throws {Object} - Throws a 401 error if no user is logged in.
  * * @throws {Object} - Throws a 203 error if the user has no favorite recipes.
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
  * This route allows users to remove a recipe from their favorites.
  * It checks if the user is logged in by verifying the session user_id.
  * If the user is logged in, it retrieves the user_id from the session
  * and the recipe_id from the request body.
  * It then calls the removeFavorite function from user_utils to remove the recipe from favorites.
  * If successful, it responds with a 200 status and a success message.
  * * * @route DELETE /FavoritesRecipes
  * * * @returns {Object} - A success message indicating the recipe was removed from favorites.
  * * * @throws {Object} - Throws a 401 error if no user is logged in.
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
/**
  * This route allows users to add a new recipe.
  * It checks if the user is logged in by verifying the session user_id. 
  * If the user is logged in, it retrieves the user_id from the session
  * and the recipe details from the request body.
  * It then calls the addNewRecipe function from user_utils to save the new recipe.
  * If successful, it responds with a 201 status and a success message.
  * * * @route POST /addNewRecipe
  * * * @returns {Object} - A success message indicating the recipe was created successfully.
  * * * @throws {Object} - Throws a 401 error if no user is logged in.  
  * * * * @throws {Object} - Throws a 401 error if the input is invalid or required fields are missing.
  * * * @throws {Object} - Throws an error if there is an issue with adding the new recipe.
*/
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
    const newRecipeId = await user_utils.addNewRecipe(recipe_details);
    await user_utils.addToMyMeal(recipe_details.user_id, newRecipeId);
    res.status(201).send({
      message: "Recipe has been created successfully.",
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

// ====================================ADD NEW RECIPE & Get Recipes========================================================


// ====================================MyRecipes===========================================================================
/**
 * This route retrieves the recipes created by the logged-in user.
 * Endpoint: GET /MyRecipes
 * Response: List of recipes created by the user.
 * * If the user is not logged in, it throws a 401 error with a message indicating that the user is not logged in.
 * * If the user has no recipes, it returns an empty array with a 200 status.
 * * If the user has recipes, it retrieves the recipe previews and sends them in the response.
 * * @route GET /MyRecipes
 * * @returns {Array} - An array of recipes created by the user.
 * * * @throws {Object} - Throws a 401 error if no user is logged in.
 * * * @throws {Object} - Throws an error if there is an issue with retrieving the user's recipes. 
*/
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
// ====================================MyRecipes===================================================================================


//================================== FamilyRecipes =================================================================================

/**
 * This route retrieves the family recipes of the logged-in user.
 * Endpoint: GET /FamilyRecipes
 * Response: List of family recipes.
 * * If the user is not logged in, it throws a 401 error with a message indicating that no user is logged in.
 * * If the user has no family recipes, it returns an empty array with a 200 status.
 * * If the user has family recipes, it retrieves them and sends them in the response.
 * * @route GET /FamilyRecipes
 * * @returns {Array} - An array of family recipes.
 * * * @throws {Object} - Throws a 401 error if no user is logged in.
 * * * * @throws {Object} - Throws an error if there is an issue with retrieving the user's family recipes.
 * */
router.get("/FamilyRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No user logged in" };
    }
    const user_id = req.session.user_id;
    const recipes = await user_utils.getFamilyRecipes(user_id);
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This route allows users to add a family recipe.
 * It checks if the user is logged in by verifying the session user_id.
 * If the user is logged in, it retrieves the user_id from the session
 * and the family recipe details from the request body.
 * It then calls the addFamilyRecipe function from user_utils to save the family recipe.
 * If successful, it responds with a 201 status and a success message.
 * * * @route POST /FamilyRecipes
 * * * @returns {Object} - A success message indicating the family recipe was added successfully.
 * * * * @throws {Object} - Throws a 401 error if no user is logged in.
 * * * * @throws {Object} - Throws an error if there is an issue with adding the family recipe.
 * */
router.post("/FamilyRecipes", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No user logged in" };
    }

    const user_id = req.session.user_id;
    const {
      recipeId,
      familyMember,
      relation,
      inventor,
      bestEvent,
      ingredients,
      instructions,
      image_url,
    } = req.body;

    await user_utils.addFamilyRecipe(
      user_id,
      recipeId,
      familyMember,
      relation,
      inventor,
      bestEvent,
      ingredients,
      instructions,
      image_url
    );

    res.status(201).send({ message: "Family recipe added successfully" });
  } catch (error) {
    next(error);
  }
});


router.get("/FamilyRecipes/:recipeId", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No user logged in" };
    }

    const recipe = await user_utils.getFamilyRecipeById(
      req.session.user_id,
      req.params.recipeId
    );

    if (!recipe) {
      throw { status: 404, message: "Recipe not found" };
    }

    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});




//==================================Bonus - MyMeal=================================================================================

/**
 * This route retrieves the user's meal recipes.
 * Endpoint: GET /MyMeal
 * Response: List of recipes in the user's meal with their progress.
 * * @route GET /MyMeal
 * * @returns {Array} - An array of recipes in the user's meal with their progress.
 * * * @throws {Object} - Throws a 401 error if no user is logged in.
 * * * @throws {Object} - Throws an error if there is an issue with retrieving the user's meal recipes.
 */
router.get("/MyMeal", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipes_info = await user_utils.getMyMealRecipes(user_id);
    if (recipes_info.length === 0) {
      return res.status(200).send([]);  
    }

    const recipes_id = recipes_info
      .map(r => r.id)           
      .filter(id => id != null);       

    const recipePreviews = await recipes_utils.getRecipesPreview(recipes_id);

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
  * This route allows users to add a recipe to their meal.
  * It checks if the user is logged in by verifying the session user_id.
  * If the user is logged in, it retrieves the user_id from the session
  * and the recipe_id from the request body.
  * It then calls the addToMyMeal function from user_utils to add the recipe to the user's meal.
  * If successful, it responds with a 200 status and a success message.
  * * * @route POST /MyMeal
  * * * @returns {Object} - A success message indicating the recipe was added to the user's meal.
  * * * @throws {Object} - Throws a 401 error if no user is logged in.
  * * * @throws {Object} - Throws an error if there is an issue with adding the recipe to the user's meal.
 */

router.post("/MyMeal", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    console.log("user id = ", user_id, " recipe_id= ", recipe_id);
    await user_utils.addToMyMeal(user_id, recipe_id);
    res.status(200).send("The Recipe successfully add to user meal.");
  }
   catch (error) {
    next(error);
  }
});

/**
  * This route allows users to add a recipe to their meal.
  * It checks if the user is logged in by verifying the session user_id.
  * If the user is logged in, it retrieves the user_id from the session
  * and the recipes_order_id from the request body.
  * It then retrieves the user's meal recipes and removes all existing recipes from the meal.
  * It then iterates through the recipes_order_id and checks if each recipe exists in the user's meal.
  * If a matching recipe is found, it adds the recipe back to the user's meal and updates its progress.
  * If a recipe is not found, it throws an error.
  * If successful, it responds with a 200 status and a success message indicating that the recipes were successfully reordered.
  * * * @route PUT /MyMeal
  * * * @returns {Object} - A success message indicating the recipes were successfully reordered.
  * * * @throws {Object} - Throws a 401 error if no user is logged in.
  * * * @throws {Object} - Throws an error if there is an issue with reordering the recipes in the user's meal.
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
 * This route allows users to reorder their meal recipes.
 * Endpoint: PUT /MyMeal
 * Body Parameters: recipes_order_id (Array of recipe IDs in the desired order)
 * Response: Success or failure message.
 * * * If the user is not logged in, it throws a 401 error with a message indicating that the user is not logged in.
 * * * If the user has no recipes, it returns an empty array with a 200 status.
 * * * If the user has recipes, it retrieves the recipe previews and sends them in the response.
 * * * @route PUT /MyMeal
 * * * @returns {Object} - A success message indicating the recipes were successfully reordered.
 * * * * @throws {Object} - Throws a 401 error if no user is logged in.
 * * * * @throws {Object} - Throws an error if there is an issue with reordering the recipes in the user's meal.
 */

router.delete("/MyMeal", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    const remove = await user_utils.removeFromMyMeal(user_id, recipe_id);
    if (remove === "Not Found") {
      return res.status(404).send("Recipe not found in user's meal");
    }
    res.status(200).send("The Recipe successfully removed from user meal");
  }
   catch (error) {
    next(error);
  }
});


//==================================Bonus - MyMeal=================================================================================

//==================================Bonus - Recipe Making Process=================================================================================

/**
 * This route retrieves the making progress of a specific recipe in the user's meal.
 * Endpoint: GET /RecipeMaking
 * Response: Progress details of the specific recipe.
 * * @route GET /RecipeMaking
 * * @returns {Object} - An object containing the progress details of the specific recipe.
 * * * * @throws {Object} - Throws a 401 error if no user is logged in.
 * * * * @throws {Object} - Throws an error if there is an issue with retrieving the making progress of the recipe.
 */
router.get("/RecipeMaking", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipeId;
    console.log("user.js: recipe_id = ", recipe_id);
    const recipe_info = await user_utils.getMyMealRecipes(user_id, recipe_id);
    const recipePreviews = await recipe_utils.getRecipesPreview([recipe_id]);
    const results = await user_utils.fetchRecipeProgress(
      recipe_info,
      recipePreviews
    );
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

/**
  * This route allows users to update the making progress of a specific recipe in their meal.
  * It checks if the user is logged in by verifying the session user_id.
  * If the user is logged in, it retrieves the user_id from the session
  * and the recipe_id and recipe_progress from the request body.
  * It then calls the updateRecipeProgressInMyMeal function from user_utils to update the recipe's making progress.
  * If successful, it responds with a 200 status and a success message.
  * * * @route PUT /RecipeMaking
  * * * @returns {Object} - A success message indicating the recipe making progress was updated successfully.
  * * * * @throws {Object} - Throws a 401 error if no user is logged in.
  * * * * @throws {Object} - Throws an error if there is an issue with updating the recipe making progress.
*/
router.put("/RecipeMaking", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    console.log(
      "user_id = ",
      req.session.user_id,
      " recipe_id = ",
      req.body.recipeId,
      " recipe_progress = ",
      req.body.recipe_progress
    );
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    const recipe_progress = "[" + req.body.recipe_progress.toString() + "]";
    await user_utils.updateRecipeProgressInMyMeal(
      user_id,
      recipe_id,
      recipe_progress
    );
    res
      .status(200)
      .send("You have successfully update the recipe making progress.");
  } catch (error) {
    next(error);
  }
});


/**
 * This route retrieves the making progress of a specific recipe in the user's meal.
 * Endpoint: GET /RecipeMakingProgress/:recipeId
 * Response: Progress details of the specific recipe.
 * * * If the user is not logged in, it throws a 401 error with a message indicating that the user is not logged in.
 * * * If the recipe is not found in the user's meal, it returns a 404 status with a message indicating that the recipe was not found.
 * * * If the recipe is found, it retrieves the recipe information and sends it in the response.
 * * * @route GET /RecipeMakingProgress/:recipeId
 * * @returns {Object} - An object containing the progress details of the specific recipe.
 * * * * @throws {Object} - Throws a 401 error if no user is logged in.
 * * * * * @throws {Object} - Throws a 404 error if the recipe is not found in the user's meal.
 * * * * * @throws {Object} - Throws an error if there is an issue with retrieving the making progress of the recipe.
 */
router.get("/RecipeMakingProgress/:recipeId", async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 401, message: "No User Logged in." };
    }
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipeId;
    console.log("user.js: recipe_id = ", recipe_id);
    const recipe_info = await user_utils.getMyMealRecipes(user_id, recipe_id);
    if (recipe_info.length === 0) {
      return res.status(404).send("Recipe not found in user's meal");
    } else {
      res.status(200).send(recipe_info[0]);
    }
  } catch (error) {
    next(error);
  }
});

//==================================Bonus - Recipe Making Process=================================================================================

module.exports = router;
