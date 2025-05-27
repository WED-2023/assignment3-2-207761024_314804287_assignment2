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