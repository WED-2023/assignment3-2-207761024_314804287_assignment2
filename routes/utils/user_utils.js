const DButils = require("./DButils");

// ==================================Last Viewed Recipes=========================================
/**
 * Updates the last viewed timestamp for a recipe for a specific user.
 * If the recipe already exists in the last viewed table, it updates the timestamp.
 * If the recipe does not exist, it inserts a new record with the current timestamp.
 * * @param {number} user_id - The ID of the user.
 * @param {number} recipe_id - The ID of the recipe.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - Throws an error if there is an issue with the database operation.
*/
async function updateLastViewed(user_id, recipe_id) {
  const existingRecipeResult = await DButils.execQuery(
    `SELECT recipe_id FROM lastviewedrecipes WHERE user_id = '${user_id}' AND recipe_id = '${recipe_id}'`
  );

  if (existingRecipeResult.length > 0) {
    await DButils.execQuery(
      `UPDATE lastviewedrecipes SET viewed_at = NOW() WHERE user_id = '${user_id}' AND recipe_id = '${recipe_id}'`,
      [user_id, recipe_id]
    );
  } else {
    await DButils.execQuery(
      `INSERT INTO lastviewedrecipes (user_id, recipe_id, viewed_at) VALUES ('${user_id}', '${recipe_id}', NOW())`
    );
  }
}

/**
 * Retrieves the last viewed recipes for a specific user, ordered by the most recent view.
 * @param {number} user_id - The ID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of recipe IDs.
*/
async function getLastViewedRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM lastviewedrecipes WHERE user_id = '${user_id}' ORDER BY viewed_at DESC LIMIT 4`
  );
  return recipes_id.map((row) => row.recipe_id);
}

/**
 * Retrieves all last viewed recipes for a specific user.
 * @param {number} user_id - The ID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of recipe IDs.
 * @throws {Error} - Throws an error if there is an issue with the database operation.
*/
async function getAllLastViewedRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM lastviewedrecipes WHERE user_id = '${user_id}'`
  );
  return recipes_id.map((row) => row.recipe_id);
}
// ==================================Last Viewed Recipes=========================================


// ==================================Add New Recipe & MyRecipes=========================================
/**
 * Adds a new recipe to the user's collection.
 * This function performs the following steps:
 * 1. Validates the recipe details (currently commented out).
 * 2. Inserts the recipe details into the `myrecipes` table.
 * 3. Retrieves the last inserted recipe ID.
 * 4. Inserts the ingredients for the recipe into the `ingredients` table.
 * 5. Inserts the instructions for the recipe into the `instructions` table.
 * * @param {Object} recipe_details - The details of the recipe to be added.
 * * @param {number} recipe_details.user_id - The ID of the user adding the recipe.
 * * @param {string} recipe_details.title - The title of the recipe.
 * * @param {string} recipe_details.image - The image URL of the recipe.
 * * @param {number} recipe_details.ready_in_minutes - The time required to prepare the recipe in minutes.
 * * @param {string} recipe_details.summary - A brief summary of the recipe.
 * * @param {number} recipe_details.servings - The number of servings the recipe yields.
 * * @param {boolean} recipe_details.vegan - Indicates if the recipe is vegan.
 * * @param {boolean} recipe_details.vegetarian - Indicates if the recipe is vegetarian.
 * * @param {boolean} recipe_details.is_gluten_free - Indicates if the recipe is gluten-free.
 * * @param {Array} recipe_details.ingredients - An array of ingredient objects, each containing `name`, `quantity`, and `unit`.
 * * * @param {Array} recipe_details.instructions - An array of instruction strings for the recipe.
 * * @returns {Promise<void>} - A promise that resolves when the recipe is successfully added.
 * * @throws {Error} - Throws an error if there is an issue with the database operation or if the recipe details are invalid.
*/
async function addNewRecipe(recipe_details) {
  //newRecipeValidations(recipe_details);
  await DButils.execQuery(
    `INSERT INTO myrecipes (user_id, title, image, ready_in_minutes, summary, servings, vegan, vegetarian, is_gluten_free) VALUES ('${ recipe_details.user_id}',
     '${recipe_details.title}', '${recipe_details.image}', '${parseFloat(recipe_details.ready_in_minutes)}', 
    '${recipe_details.summary}', ${parseInt(recipe_details.servings)}, ${recipe_details.vegan ? 1 : 0},
     ${recipe_details.vegetarian ? 1 : 0}, ${recipe_details.is_gluten_free ? 1 : 0})`
  );
  const [lastInsertResult] = await DButils.execQuery(
    `SELECT LAST_INSERT_ID() as recipe_id`
  );
  const newRecipeId = lastInsertResult.recipe_id;
  for (const ingredient of recipe_details.ingredients) {
    console.log(ingredient);
    console.log(ingredient.name);
    await DButils.execQuery(
      `INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES ('${newRecipeId}', '${ingredient.name}', '${ingredient.quantity}', '${ingredient.unit}')`
    );
  }
  let order = 0;
  for (const instruction of recipe_details.instructions) {
    await DButils.execQuery(
      `INSERT INTO instructions (recipe_id, instruction_order, instruction_text) VALUES ('${newRecipeId}', '${order++}', '${instruction}')`
    );
  }
  return newRecipeId;
}

/**
 * Retrieves all my recipes for a specific user.
 * @param {number} user_id - The ID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of recipe IDs.
 * @throws {Error} - Throws an error if there is an issue with the database operation.
*/
async function getMyRecipes(user_id) {
  const myRecipes = await DButils.execQuery(
    `SELECT * FROM myrecipes WHERE user_id = '${user_id}'`
  );
  return myRecipes.map((recipe) =>{ return recipe.recipe_id} );
}


// ==================================Add New Recipe & MyRecipes=========================================

// ==================================Favorite Recipes=========================================

/**
 * Marks a recipe as a favorite for the specified user.
 *
 * @param {number} user_id - The ID of the user.
 * @param {number} recipe_id - The ID of the recipe.
 */
async function markAsFavorite(user_id, recipe_id) {
  if(recipe_id == undefined) return;
  const checkIfFromDB = await DButils.execQuery(
    `SELECT 1 FROM myrecipes WHERE recipe_id = '${recipe_id}'`
  );

  if (checkIfFromDB.length == 0) {
    const RecipeType = "Spoonacular";
    await DButils.execQuery(
      `INSERT INTO userfavorites (userId, externalRecipeId, recipeSource) VALUES ('${user_id}', '${recipe_id}', '${RecipeType}')`
    );
  } else {
    const RecipeType = "MyRecipes";
    await DButils.execQuery(
      `INSERT INTO userfavorites (userId, recipeId, recipeSource) VALUES ('${user_id}', '${recipe_id}', '${RecipeType}')`
    );
  }
}

/**
 * Retrieves the list of favorite recipes for a specific user.
 * * @param {number} user_id - The ID of the user.
 * * @returns {Promise<Array>} - A promise that resolves to an array of recipe IDs.
 * * This function queries the `userfavorites` table to get the recipe IDs of the user's favorite recipes.
 * * If the user has no favorite recipes, it returns an empty array.
 * * @throws {Error} - Throws an error if there is an issue with the database operation.
*/
async function getFavoriteRecipes(user_id) {
  const recipes = await DButils.execQuery(
    `SELECT externalRecipeId FROM userfavorites WHERE userId='${user_id}'`
  );
  return recipes.map(row => row.externalRecipeId);
}

/**
 * Removes a recipe from the user's favorites.
 * * @param {number} user_id - The ID of the user.
 * * @param {number} recipe_id - The ID of the recipe to be removed from favorites.
 * * This function deletes the specified recipe from the `userfavorites` table for the given user.
 * * If the recipe does not exist in the user's favorites, it will not throw an error.
 * * @throws {Error} - Throws an error if there is an issue with the database operation.
*/
async function removeFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    `DELETE FROM userfavorites WHERE userId = '${user_id}' AND externalRecipeId = '${recipe_id}'`
  );
}

// ==================================Favorite Recipes=========================================

// ==================================Family Recipes=========================================

/**
 * Adds a family recipe for a specific user.
 * @param {number} user_id - The ID of the user.
 * @param {number} recipeId - The ID of the recipe.
 * @param {string} familyMember - The name of the family member associated with the recipe.
 * @param {string} relation - The relation of the family member to the user.
 * @param {string} inventor - The name of the person who invented the recipe.
 * @param {string} bestEvent - The best event associated with the recipe.
 * @param {string} ingredients - List of ingredients (stored as text).
 * @param {string} instructions - Step-by-step instructions in analyzed format.
 * @param {string} image_url - Optional image URL.
 */
async function addFamilyRecipe(user_id, recipeId, familyMember, relation, inventor, bestEvent, ingredients, instructions, image_url) {
  await DButils.execQuery(
    `INSERT INTO familyrecipes
      (user_id, recipe_id, family_member, relation, inventor, best_event, ingredients, instructions, image_url)
     VALUES ('${user_id}', '${recipeId}', '${familyMember}', '${relation}', '${inventor}', '${bestEvent}', '${ingredients}', '${instructions}', '${image_url}')`
  );
}


/**
 * Retrieves all family recipes for a specific user.
 * @param {number} user_id - The ID of the user.
 * @returns {Promise<Array>} - Array of family recipes.
 */
async function getFamilyRecipes(user_id) {
  const recipes = await DButils.execQuery(
    `SELECT * FROM familyrecipes WHERE user_id = '${user_id}' ORDER BY created_at DESC`
  );
  return recipes;
}


// ==================================Family Recipes=========================================


//====================================Bonus - MyMeal & Recipe Making Progress=================================================

/**
 * Fetches the recipe progress for each recipe preview.
 * @param {Array} recipes_info - An array of recipe information objects containing recipe IDs and progress.
 * @param {Array} recipePreviews - An array of recipe preview objects containing recipe IDs.
 * @return {Array} - An array of recipe preview objects with added recipe progress.
 * This function maps over the recipePreviews array and finds the corresponding recipe_info from recipes_info based on the recipe ID.
 * It adds the recipe_progress from recipes_info to each recipePreview object.
 * If a recipe_info is not found, it sets recipe_progress to null.
 * * @throws {Error} - Throws an error if there is an issue with the input data or if the recipe IDs do not match.
 * */
async function fetchRecipeProgress(recipes_info, recipePreviews) {
  return recipePreviews.map((recipePreview) => {
    const recipe_info = recipes_info.find(
      (recipe) => recipe.recipe_id == recipePreview.id
    );
    return {
      ...recipePreview,
      recipe_progress: recipe_info ? recipe_info.recipe_progress : null,
    };
  });
}


/**
 * Retrieves the list of recipes in the user's meal.
 * @param {number} user_id - The ID of the user.
 * @param {number|null} recipe_id - The ID of a specific recipe to retrieve (optional).
 * @returns {Promise<Array>} - A promise that resolves to an array of recipe information.
 */
async function getMyMealRecipes(user_id, recipe_id = null) {
  const recipes = recipe_id
    ? await DButils.execQuery(`SELECT recipeId, externalRecipeId, recipeSource, recipeProgress FROM usermeal WHERE userId = '${user_id}' AND (recipeId = '${recipe_id}' OR externalRecipeId = '${recipe_id}')`)
    : await DButils.execQuery(`SELECT recipeId, externalRecipeId, recipeSource, recipeProgress FROM usermeal WHERE userId = '${user_id}'`);

  if (recipes.length === 0) return [];

  const recipes_info = [];

  for (const recipe of recipes) {
    let recipe_progress = null;
    if (recipe.recipeProgress) {
      try {
        recipe_progress = JSON.parse(recipe.recipeProgress);
      } catch (error) {
        console.error(`Error parsing recipeProgress for recipe_id: ${recipe.recipeId || recipe.externalRecipeId}`, error);
        recipe_progress = null;
      }
    }

    if (recipe.recipeSource === "MyRecipes") {
      const result = await DButils.execQuery(
        `SELECT * FROM myrecipes WHERE recipe_id = '${recipe.recipeId}'`
      );
      if (result.length > 0) {
        const fullRecipe = result[0];
        fullRecipe.recipe_progress = recipe_progress;
        fullRecipe.id = recipe.recipeId;

        const instructions = await DButils.execQuery(
          `SELECT instruction FROM instructions WHERE recipe_id = '${recipe.recipeId}'`
        );
        const ingredients = await DButils.execQuery(
          `SELECT name, quantity, unit FROM ingredients WHERE recipe_id = '${recipe.recipeId}'`
        );

        fullRecipe.analyzedInstructions = [
          { steps: instructions.map((step, index) => ({ number: index + 1, step: step.instruction })) }
        ];
        fullRecipe.extendedIngredients = ingredients;

        recipes_info.push(fullRecipe);
      }
    }
    else if (recipe.recipeSource === "Spoonacular") {
      recipes_info.push({
        id: recipe.externalRecipeId,
        recipe_progress,
      });
    }
  }

  return recipes_info;
}

// async function getMyMealRecipes(user_id, recipe_id = null) {
//   console.log("user_utils.js: recipe_id = ", recipe_id);
//   const recipes = recipe_id
//     ? await DButils.execQuery(`SELECT recipeId, externalRecipeId, recipeSource, recipeProgress FROM usermeal WHERE userId = '${user_id}' AND (recipeId = '${recipe_id}' OR externalRecipeId = '${recipe_id}')`)
//     : await DButils.execQuery(`SELECT recipeId, externalRecipeId, recipeSource, recipeProgress FROM usermeal WHERE userId = '${user_id}'`);

//   console.log("user_utils.js: before if (recipes.length == 0)");

//   if (recipes.length == 0) {
//     console.log("user_utils.js: inside if (recipes.length == 0)");
//     return [];
//   }
//   console.log("user_utils.js: after if (recipes.length == 0)");

//   const recipes_info = recipes.map((recipe) => {
//     let recipe_progress = null;
    
//     if (recipe.recipeProgress) {
//       try {
//         recipe_progress = JSON.parse(recipe.recipeProgress);
//       } catch (error) {
//         console.error(`Error parsing recipeProgress for recipe_id: ${recipe.recipeId || recipe.externalRecipeId}`, error);
//         recipe_progress = null;  
//       }
//     }

//     if (recipe.recipeSource === "MyRecipes") {
//       return {
//         recipe_id: recipe.recipeId,
//         recipe_progress,
//       };
//     } else if (recipe.recipeSource === "Spoonacular") {
//       return {
//         recipe_id: recipe.externalRecipeId,
//         recipe_progress,
//       };
//     }
//   });

//   console.log("user_utils.js: recipes_info", recipes_info);
//   return recipes_info;
// }

/**
 * Adds a recipe to the user's meal.
 * @param {number} user_id - The ID of the user.
 * @param {number} recipe_id - The ID of the recipe to be added to the meal.
 */
async function addToMyMeal(user_id, recipe_id) {
  if(recipe_id == undefined) return;
  console.log("user_utils - 1");
  const checkIfInUserMeal = await DButils.execQuery(
    `SELECT * FROM usermeal WHERE userId = '${user_id}' AND (recipeId = '${recipe_id}' OR externalRecipeId = '${recipe_id}')`
  );

  if (checkIfInUserMeal.length != 0)
    throw { status: 401, message: "Recipe is already in user meal." };

  const checkIfFromDB = await DButils.execQuery(
    `SELECT 1 FROM myrecipes WHERE recipe_id = '${recipe_id}'`
  );
  if (checkIfFromDB.length == 0) {
    const RecipeType = "Spoonacular";
    await DButils.execQuery(
      `insert into usermeal (userId, externalRecipeId, recipeSource) values ('${user_id}','${recipe_id}','${RecipeType}')`
    );
  } else {
    const RecipeType = "MyRecipes";
    await DButils.execQuery(
      `insert into usermeal (userId, recipeId, recipeSource) values ('${user_id}','${recipe_id}','${RecipeType}')`
    );
}
}


/**
 * Removes a recipe from the user's meal.
 * @param {number} user_id - The ID of the user.
 * @param {number} recipe_id - The ID of the recipe to be removed from the meal.
 */
async function removeFromMyMeal(user_id, recipe_id) {
  if(recipe_id == undefined) return;
  console.log("removeFromMyMeal: recipeId = ", recipe_id);

  const checkIfFromDB = await DButils.execQuery(
    `SELECT 1 FROM usermeal WHERE recipeId = '${recipe_id}' OR externalRecipeId = '${recipe_id}'` // Check if the recipe exists in the user's meal
  );
  if (checkIfFromDB.length == 0) {
    return "Not Found";
  }
  else await DButils.execQuery(
    `DELETE FROM usermeal WHERE userId = '${user_id}' AND (recipeId = '${recipe_id}' OR externalRecipeId = '${recipe_id}')`
  );
}

/**
 * Updates the progress of a recipe in the user's meal.
 * @param {number} user_id - The ID of the user.
 * @param {number} recipe_id - The ID of the recipe.
 * @param {string} recipe_progress - The progress data of the recipe.
 */
async function updateRecipeProgressInMyMeal(user_id, recipe_id, recipe_progress) {
  const checkIfInUserMeal = await DButils.execQuery(
    `SELECT * FROM usermeal WHERE userId = '${user_id}' AND (recipeId = '${recipe_id}' OR externalRecipeId = '${recipe_id}')`
    
  );

  if (checkIfInUserMeal.length == 0)
    throw { status: 401, message: "Recipe ID is not in user meal." };

  await DButils.execQuery(
    `UPDATE usermeal SET recipeProgress = '${recipe_progress}' WHERE userId = '${user_id}' AND (recipeId = '${recipe_id}' OR externalRecipeId = '${recipe_id}')`
  );
}

//====================================Bonus - MyMeal & Recipe Making Progress=================================================




exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.removeFavorite = removeFavorite;
exports.updateLastViewed = updateLastViewed;
exports.getLastViewedRecipes = getLastViewedRecipes;
exports.getAllLastViewedRecipes = getAllLastViewedRecipes;
exports.addNewRecipe = addNewRecipe;
exports.getMyRecipes = getMyRecipes;
exports.addFamilyRecipe = addFamilyRecipe;
exports.getFamilyRecipes = getFamilyRecipes;
exports.fetchRecipeProgress = fetchRecipeProgress;
exports.removeFromMyMeal = removeFromMyMeal;
exports.addToMyMeal = addToMyMeal;
exports.getMyMealRecipes = getMyMealRecipes;
exports.updateRecipeProgressInMyMeal = updateRecipeProgressInMyMeal;
