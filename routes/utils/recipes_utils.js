const axios = require("axios");
const DButils = require("../utils/DButils");
const e = require("express");
const api_domain = "https://api.spoonacular.com/recipes";


// ====================== Random Recipes ========================

/**
 * Fetch a list of random recipes from the Spoonacular API and extract relevant data for preview.
 * @param {number} number - Number of random recipes to fetch. Default is 3.
 * @returns {Promise<Array>} - A promise that resolves to an array of recipe previews.
 * @throws {Object} - Throws an error if no random recipes are found or there is an issue with the Spoonacular API.
 */
async function getRandomRecipes(number = 4) {
  const params = {
    apiKey: process.env.spooncular_apiKey,
    number: number,
  };
  const url = `${api_domain}/random`; // Corrected to use backticks for template literals
  const randomRecipes = await axios.get(url, { params });
  console.log("Spoonacular response:", randomRecipes.data);

  if (randomRecipes.data.recipes.length > 0) {
    // Map and return the relevant recipe details for preview
    return randomRecipes.data.recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      aggregateLikes: recipe.aggregateLikes,
      vegan: recipe.vegan,
      vegetarian: recipe.vegetarian,
      glutenFree: recipe.glutenFree,
    }));
  } else {
    throw {
      status: 500,
      message: "No random recipes found/issue with Spoonacular API.",
    };
  }
}


// ====================== Random Recipes ========================
// ====================== Recipe /{recipe_id} ========================

/**
  * Fetch full information about a recipe by its ID, either from the database or Spoonacular API.
  * @param {number} recipe_id - The ID of the recipe to fetch.
  * @return {Promise<Object>} - A promise that resolves to an object containing full recipe information.
  * @throws {Object} - Throws an error if the recipe is not found in either the database or Spoonacular API.
  * @throws {Object} - Throws an error if there is an issue with fetching the recipe information.
  * @throws {Object} - Throws an error if there is an issue with the database connection.
  * @throws {Object} - Throws an error if there is an issue with the Spoonacular API.
  * @throws {Object} - Throws an error if there is an issue with the recipe ID.
  * @throws {Object} - Throws an error if the recipe ID is invalid.
*/
async function getRecipeFullInformationForAPI(recipe_id) {
  const checkIfFromDB = await DButils.execQuery(
    `SELECT 1 FROM myrecipes WHERE recipe_id = '${recipe_id}'`
  );

  if (checkIfFromDB.length == 0) {
    // Fetch recipe details from Spoonacular API
    let recipe = await getRecipeFullInformation(recipe_id, false);
    let {
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
      analyzedInstructions,
      extendedIngredients,
      servings,
    } = recipe.data;
    return {
      id: id,
      title: title,
      readyInMinutes: readyInMinutes,
      image: image,
      popularity: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
      instructions: analyzedInstructions[0].steps.map((step) => step.step),
      extendedIngredients: extendedIngredients,
      servings: servings,
    };
  } else {
    // Fetch recipe details from the database
    let recipe = await getRecipeFullInformation(recipe_id, true);
    let {
      recipe_id: db_recipe_id,
      title,
      ready_in_minutes,
      image,
      vegan,
      vegetarian,
      is_gluten_free,
      servings,
    } = recipe.recipe_information;
    let ingredients = [];
    for (const ingredient of recipe.recipe_ingredients) {
      let { name, quantity, unit } = ingredient;
      ingredients.push({ originalName: name, amount: quantity, unit: unit });
    }
    let instructions = [];
    for (const instruction of recipe.recipe_instructions) {
      let { instruction_text } = instruction;
      instructions.push(instruction_text);
    }
    return {
      id: db_recipe_id,
      title: title,
      readyInMinutes: ready_in_minutes,
      image: image,
      popularity: 0,
      vegan: Boolean(vegan),
      vegetarian: Boolean(vegetarian),
      glutenFree: Boolean(is_gluten_free),
      instructions: instructions,
      ingredients: ingredients,
      extendedIngredients: ingredients,
      servings: servings,
    };
  }
}



// helper function - to get full recipe information
/**
 * Get full recipe information from the database or Spoonacular API.
 * @param {number} recipe_id - The ID of the recipe to retrieve.
 * @param {boolean} fromDB - Indicates if the request is from the database.
 * @return {Promise<Object>} - A promise that resolves to the full recipe information.
 * @throws {Object} - Throws an error if the recipe is not found in either the database or Spoonacular API.
 * * @throws {Object} - Throws an error if there is an issue with fetching the recipe information.
 * * * @throws {Object} - Throws an error if there is an issue with the database connection.
 * * * @throws {Object} - Throws an error if there is an issue with the Spoonacular API.
 * * * @throws {Object} - Throws an error if there is an issue with the recipe ID.
 * * * @throws {Object} - Throws an error if the recipe ID is invalid.
 * */
async function getRecipeFullInformation(recipe_id, fromDB) {
  if (fromDB) {
    const recipe_information = (
      await DButils.execQuery(
        `SELECT * FROM myrecipes WHERE recipe_id = '${recipe_id}'`
      )
    )[0];
    const recipe_ingredients = await DButils.execQuery(
      `SELECT * FROM ingredients WHERE recipe_id = '${recipe_id}'`
    );
    const recipe_instructions = await DButils.execQuery(
      `SELECT * FROM instructions WHERE recipe_id = '${recipe_id}' ORDER BY instruction_order`
    );

    const recipe = {
      recipe_information: recipe_information,
      recipe_ingredients: recipe_ingredients,
      recipe_instructions: recipe_instructions,
    };

    return recipe;
  } else {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
      params: {
        includeNutrition: false,
        apiKey: process.env.spooncular_apiKey,
      },
    });
  }
}



// ====================== Recipe /{recipe_id} ========================
// ====================== Recipes Preview ========================

/**
 * Get a preview of recipes based on an array of recipe IDs.
 * @param {Array<number>} recipes_id_array - An array of recipe IDs to get previews for.
 * @param {boolean} is_search - Indicates if the request is from a search (default is false).
 * * @returns {Promise<Array>} - A promise that resolves to an array of recipe previews.
 * * @throws {Object} - Throws an error if there is an issue with retrieving the recipe previews or if the recipe IDs are invalid.
 * * This function retrieves recipe details for each ID in the provided array.
 * * It uses the `getRecipeDetails` helper function to fetch the details for each recipe ID.
 * * The results are collected in an array and returned.
 */
async function getRecipesPreview(recipes_id_array, is_search = false) {
  const recipesDetailsArray = [];
  const recipeDetailsPromises = recipes_id_array.map(async (recipe_id) => {
    const recipeDetails = await getRecipeDetails(recipe_id, is_search);
    return recipeDetails;
  });

  const resolvedRecipesDetails = await Promise.all(recipeDetailsPromises);
  recipesDetailsArray.push(...resolvedRecipesDetails);

  return recipesDetailsArray;
}

//Helper function to get recipe details for preview
/**
 * Get details of a recipe by its ID, either from the database or Spoonacular API.
 * @param {number} recipe_id - The ID of the recipe to retrieve.
 * @param {boolean} is_search - Indicates if the request is from a search (default is false).
 * @returns {Promise<Object>} - A promise that resolves to an object containing recipe details.
 * @throws {Error} - Throws an error if the recipe ID is invalid or if there is an issue with fetching the recipe information.
 */
async function getRecipeDetails(recipe_id, is_search = false) {
  if(!recipe_id) {
    throw new Error("invalid recipe id : ",recipe_id);
  }
  let recipe_info = await getRecipeInformation(recipe_id, is_search);
  const recipeInformation = recipe_info.recipeInformation;
  const fromDB = recipe_info.fromDB;

  if (fromDB && !is_search) {
    let {
      recipe_id,
      title,
      ready_in_minutes,
      image,
      vegan,
      vegetarian,
      is_gluten_free,
    } = recipeInformation;
    return {
      id: recipe_id,
      title: title,
      readyInMinutes: ready_in_minutes,
      image: image,
      popularity: 0,
      vegan: Boolean(vegan),
      vegetarian: Boolean(vegetarian),
      glutenFree: Boolean(is_gluten_free),
    };
  } else {
    // Return recipe details from Spoonacular API
    let {
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
    } = recipeInformation.data;
    return {
      id: id,
      title: title,
      readyInMinutes: readyInMinutes,
      image: image,
      popularity: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
    };
  }
}

// Helper function to get recipe information from the database or Spoonacular API
/**
 * Get recipe information from the database or Spoonacular API.
 * @param {number} recipe_id - The ID of the recipe to retrieve.
 * @param {boolean} is_search - Indicates if the request is from a search.
 * @returns {Promise<Object>} - A promise that resolves to the recipe information.
 */
async function getRecipeInformation(recipe_id, is_search = false) {
  
  const checkIfFromDB = await DButils.execQuery(
    `SELECT 1 FROM myrecipes WHERE recipe_id = '${recipe_id}'`
  );

  if (checkIfFromDB.length > 0 && !is_search) {
    // Fetch recipe from the database
    const recipeInformation = (
      await DButils.execQuery(
        `SELECT * FROM myrecipes WHERE recipe_id = '${recipe_id}'`
      )
    )[0];
    return { recipeInformation: recipeInformation, fromDB: true };
  } else {
    // Fetch recipe from Spoonacular API
    const recipeInformation = await axios.get(
      `${api_domain}/${recipe_id}/information`, // Corrected to use backticks
      {
        params: {
          includeNutrition: false,
          apiKey: process.env.spooncular_apiKey,
        },
      }
    );
    return { recipeInformation: recipeInformation, fromDB: false };
  }
}
// // ====================== Recipes Preview ========================
// ====================== Search ========================
/**
 * Search for recipes based on various criteria using the Spoonacular API.
 * @param {string} recipeName - The name of the recipe to search for.
 * @param {string} cuisines - The cuisine type to filter by.
 * @param {string} diets - The diet type to filter by.
 * @param {string} intolerances - The intolerance type to filter by.
 * @param {number} number - The number of results to return (default is 5).
 * @param {string} sort - The sorting criteria for the results.
 * @returns {Promise<Array>} - A promise that resolves to an array of recipe previews.
 */

async function searchRecipe(recipeName, cuisines, diets, intolerances, number, sort) {
  const response = await axios.get(`${api_domain}/complexSearch`, {
    params: {
      query: recipeName,
      cuisine: cuisines,
      diet: diets,
      intolerances: intolerances,
      number: number,
      sort: sort,
      apiKey: process.env.spooncular_apiKey,
    },
  });

  const results = response.data.results;
  
  if (!results || results.length === 0) {
    throw { status: 404, message: "No recipes found for the given search parameters." };
  }

  const recipeIds = results.map((recipe) => recipe.id);
  return await getRecipesPreview(recipeIds, true);
}



async function getAnalyzedInstructions(recipe_id) {
  const sourceResult = await DButils.execQuery(`
    SELECT recipeSource FROM usermeal 
    WHERE recipeId = '${recipe_id}' OR externalRecipeId = '${recipe_id}'
    LIMIT 1
  `);

  const recipeSource = sourceResult[0]?.recipeSource;

  if (recipeSource === "MyRecipes") {
    const instructions = await DButils.execQuery(`
      SELECT instruction_order, instruction_text 
      FROM instructions 
      WHERE recipe_id = '${recipe_id}' 
      ORDER BY instruction_order ASC
    `);

    const ingredients = await DButils.execQuery(`
      SELECT name FROM ingredients 
      WHERE recipe_id = '${recipe_id}'
    `);

    return [
      {
        name: "",
        steps: instructions.map((ins, index) => ({
          number: index + 1,
          step: ins.instruction_text,
          ingredients: ingredients.map(ing => ({
            id: ing.name.toLowerCase().replace(/\s/g, "_"),
            name: ing.name,
            image: `${ing.name.replace(/\s/g, "-")}.jpg`
          })),
          equipment: [],
          length: null
        }))
      }
    ];
  }

  if (recipeSource === "Spoonacular") {
    const response = await axios.get(`${api_domain}/${recipe_id}/analyzedInstructions`, {
      params: {
        apiKey: process.env.spooncular_apiKey,
      },
    });
    return response.data;
  }

  throw { status: 404, message: "Recipe not found in user meal." };
}




exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipeFullInformationForAPI = getRecipeFullInformationForAPI;
exports.getRecipeFullInformation = getRecipeFullInformation;
exports.getRecipeInformation = getRecipeInformation;
exports.getRecipesPreview = getRecipesPreview;
exports.searchRecipe = searchRecipe;
// exports.getFamilyRecipes = getFamilyRecipes;
exports.getAnalyzedInstructions = getAnalyzedInstructions;



