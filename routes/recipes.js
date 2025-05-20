var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));

/**
 * This route searches for recipes based on various criteria.
 * It accepts the following query parameters:
 * - recipeName: The name of the recipe to search for.
 * - cuisine: The cuisine type to filter by.
 * - diet: The diet type to filter by.
 * - intolerance: The intolerance type to filter by.
 * - number: The number of results to return (default is 5).
 * - sort: The sorting criteria for the results.
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
 * This route returns a specified number of random recipes.
 * It accepts the following query parameter:
 * - number: The number of random recipes to return (default is 3).
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
 * This route provides a full information of a specific recipe by its ID.
 * It accepts the following route parameter:
 * - recipe_id: The ID of the recipe to get a preview for.
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
 * This route provides a preview of multiple recipes based on their IDs.
 * It accepts the following request body parameter:
 * - recipes_id: An array of recipe IDs to get previews for.
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

module.exports = router;