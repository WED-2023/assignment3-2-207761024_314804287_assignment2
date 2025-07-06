var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));


/** 
 * This route handles searching for recipes based on various criteria.
 * It accepts the following query parameters:
 * - recipeName: The name of the recipe to search for.
 * - cuisine: The type of cuisine to filter by.
 * - diet: The type of diet to filter by.
 * - intolerance: The type of food intolerance to filter by.
 * - number: The number of results to return (default is 5).
 * - sort: The sorting criteria for the results (e.g., "popularity", "healthiness").
 * It returns a list of recipes that match the search criteria.
 * * @route GET /search
 * * @returns {Array} - An array of recipe previews that match the search criteria.
 * * @throws {Object} - Throws a 404 error if no recipes are found for the given search parameters.
 * * @throws {Object} - Throws an error if there is an issue with the Spoonacular API or the search parameters.
 */
router.get("/search", async (req, res, next) => {
  try {
    const recipeName = req.query.recipeName;
    const cuisine = req.query.cuisine;
    const diet = req.query.diet;
    const intolerance = req.query.intolerance;
    const number = req.query.number || 5; // Default to 5 results if not specified
    const sort = req.query.sort;
    const results = await recipes_utils.searchRecipe(
      recipeName,
      cuisine,
      diet,
      intolerance,
      number,
      sort
    );
    res.send(results);
  } catch (error) {
    next(error);
  }
});


/**
  * This route provides a random selection of recipes.
  * It accepts the following query parameter:
  * - number: The number of random recipes to return (default is 3).
  * It returns a list of random recipes.
  * * @route GET /random
  * * @returns {Array} - An array of random recipe previews.
  * * @throws {Object} - Throws an error if there is an issue with the Spoonacular API or retrieving random recipes.
 */
router.get("/random", async (req, res, next) => {
  try {
    const number = req.query.number || 3; // Default to 3 random recipes if not specified
    const randomRecipes = await recipes_utils.getRandomRecipes(number);
    res.status(200).send(randomRecipes);
  } catch (error) {
    next(error);
  }
});


/**
  * This route provides detailed information about a specific recipe.
  * It accepts the following URL parameter:
  * - recipe_id: The ID of the recipe to get detailed information for.
  * It returns detailed information about the specified recipe, including ingredients, instructions, and other relevant data.
  * * @route GET /:recipe_id
  * * @returns {Object} - An object containing detailed information about the specified recipe.
  * * * @throws {Object} - Throws an error if there is an issue with the Spoonacular API or retrieving the recipe information.
 */
router.get("/:recipe_id", async (req, res, next) => {
  try {
    const recipe_id = req.params.recipe_id;
    const recipe = await recipes_utils.getRecipeFullInformationForAPI(recipe_id);
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});

/**
  * This route provides a preview of recipes based on their IDs.
  * It accepts the following field in the request body:
  * - recipes_id: An array of recipe IDs for which to get previews.
  * It returns a list of recipe previews for the specified recipe IDs.
  * * @route POST /RecipesPreview
  * * @returns {Array} - An array of recipe previews for the specified recipe IDs.
  * * * @throws {Object} - Throws an error if there is an issue with retrieving the recipe previews or if the recipe IDs are invalid.
 */
router.post("/RecipesPreview", async (req, res, next) => {
  try {
    const recipes_id = req.body.recipes_id;
    const results = await recipes_utils.getRecipesPreview(recipes_id);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});


router.get("/:id/analyzedInstructions", async (req, res, next) => {
  try {
    const recipeId = req.params.id;
    const instructions = await recipes_utils.getAnalyzedInstructions(recipeId);
    res.status(200).send(instructions);
  } catch (error) {
    console.error("Error fetching analyzed instructions:", error.message);
    next(error);
  }
});







module.exports = router;