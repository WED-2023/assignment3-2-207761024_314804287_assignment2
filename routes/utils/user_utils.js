const DButils = require("./DButils");

// ==================================Last Viewed Recipes=========================================
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

async function getLastViewedRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM lastviewedrecipes WHERE user_id = '${user_id}' ORDER BY viewed_at DESC LIMIT 4`
  );
  return recipes_id.map((row) => row.recipe_id);
}

async function getAllLastViewedRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM lastviewedrecipes WHERE user_id = '${user_id}'`
  );
  return recipes_id.map((row) => row.recipe_id);
}
// ==================================Last Viewed Recipes=========================================


// ==================================Add New Recipe & MyRecipes=========================================
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
}

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

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipeId from userfavorites where userId='${user_id}'`);
    return recipes_id.map(row => row.recipeId);
}

async function removeFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    `DELETE FROM userfavorites WHERE userId = '${user_id}' AND recipeId = '${recipe_id}'`
  );
}

// ==================================Favorite Recipes=========================================

// ==================================Family Recipes=========================================

async function addFamilyRecipe(user_id, recipeId, familyMember, relation, inventor, bestEvent, tips, howTo) {
  await DButils.execQuery(
    `INSERT INTO familyrecipes
      (user_id, recipe_id, family_member, relation, inventor, best_event, tips, how_to)
     VALUES ('${user_id}', '${recipeId}', '${familyMember}', '${relation}', '${inventor}', '${bestEvent}', '${tips}', '${howTo}')`
  );
}

async function getFamilyRecipes(user_id) {
  const recipes = await DButils.execQuery(
    `SELECT * FROM familyrecipes WHERE user_id = '${user_id}' ORDER BY created_at DESC`
  );
  return recipes;
}

// ==================================Family Recipes=========================================


//====================================MyMeal=================================================

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
 *
 * @param {number} user_id - The ID of the user.
 * @param {number|null} recipe_id - The ID of a specific recipe to retrieve (optional).
 * @returns {Promise<Array>} - A promise that resolves to an array of recipe information.
 */

async function getMyMealRecipes(user_id, recipe_id = null) {
  console.log("user_utils.js: recipe_id = ", recipe_id);
  const recipes = recipe_id
    ? await DButils.execQuery(`SELECT recipeId, externalRecipeId, recipeSource, recipeProgress FROM usermeal WHERE userId = '${user_id}' AND (recipeId = '${recipe_id}' OR externalRecipeId = '${recipe_id}')`)
    : await DButils.execQuery(`SELECT recipeId, externalRecipeId, recipeSource, recipeProgress FROM usermeal WHERE userId = '${user_id}'`);

  console.log("user_utils.js: before if (recipes.length == 0)");

  if (recipes.length == 0) {
    console.log("user_utils.js: inside if (recipes.length == 0)");
    return [];
  }
  console.log("user_utils.js: after if (recipes.length == 0)");

  const recipes_info = recipes.map((recipe) => {
    let recipe_progress = null;
    
    // Check if recipeProgress is not null before parsing
    if (recipe.recipeProgress) {
      try {
        recipe_progress = JSON.parse(recipe.recipeProgress);
      } catch (error) {
        console.error(`Error parsing recipeProgress for recipe_id: ${recipe.recipeId || recipe.externalRecipeId}`, error);
        recipe_progress = null;  // Set to null if JSON parsing fails
      }
    }

    if (recipe.recipeSource === "MyRecipes") {
      return {
        recipe_id: recipe.recipeId,
        recipe_progress,
      };
    } else if (recipe.recipeSource === "Spoonacular") {
      return {
        recipe_id: recipe.externalRecipeId,
        recipe_progress,
      };
    }
  });

  console.log("user_utils.js: recipes_info", recipes_info);
  return recipes_info;
}

/**
 * Adds a recipe to the user's meal.
 *
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
 *
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
 *
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
