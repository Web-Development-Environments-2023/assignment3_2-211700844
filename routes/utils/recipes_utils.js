// Required modules and variables
const axios = require("axios");
const nodemon = require("nodemon");
const DButils = require("./DButils");
const api_domain = "https://api.spoonacular.com/recipes";


/**
 * Retrieves search results based on the provided query and filters.
 * @param {number} user_id - The ID of the user performing the search (optional).
 * @param {string} query - The search query.
 * @param {string} sort - The sorting method for the results (optional).
 * @param {number} number_of_results - The number of results to retrieve.
 * @param {string} cuisine - The cuisine filter (optional).
 * @param {string} diet - The diet filter (optional).
 * @param {string} intolerance - The intolerance filter (optional).
 * @returns {Array} - An array of recipes containing relevant details for preview.
 */
async function getSearchResults(user_id, query, sort, number_of_results, cuisine, diet, intolerance) {
  let response = await getRecipesFromSearch(query,sort, number_of_results, cuisine, diet, intolerance);
  recipes_arr = response.data.results;
  let string_ids = ""
  // collect ids of all recipes
  for (let i = 0; i < recipes_arr.length; i++) {
      string_ids += recipes_arr[i].id;
      if(i < recipes_arr.length-1)
      {
          string_ids += ","
      }
  }
  // get all needed data for those ids
  let recipes_full_data = await getRecipesInfoBulks(string_ids); 
  const recipes_splitted = [];
  for (let i = 0; i < recipes_full_data.data.length; i++) {
      recipes_splitted.push(recipes_full_data.data[i]);
  }
  return extractPreviewRecipeDetails(recipes_splitted,user_id);
}

/**
 * Retrieves recipe information for a group of recipe IDs.
 * @param {string} ids - Comma-separated string containing recipe IDs.
 * @returns {Object} - Information for the specified recipes.
 */
async function getRecipesInfoBulks(ids) {
  return await axios.get(`${api_domain}/informationBulk`, {
      params: {
          ids: ids,
          apiKey: process.env.spooncular_apiKey
      }
  });
}

/**
 * Searches for recipes based on the provided query and filters.
 * @param {string} query - The search query.
 * @param {string} sort - The sorting method for the results (optional).
 * @param {number} number_of_results - The number of results to retrieve.
 * @param {string} cuisine - The cuisine filter (optional).
 * @param {string} diet - The diet filter (optional).
 * @param {string} intolerance - The intolerance filter (optional).
 * @returns {Object} - Search results with recipe information.
 */
async function getRecipesFromSearch(query, sort, number_of_results, cuisine, diet, intolerance) {
  if(sort){
    return await axios.get(`${api_domain}/complexSearch`, {
      params: {
          number: number_of_results,
          query: query,
          cuisine: cuisine,
          diet: diet,
          intolerances: intolerance,
          sort: sort,
          apiKey: process.env.spooncular_apiKey
      }
  });
  }
  return await axios.get(`${api_domain}/complexSearch`, {
      params: {
          number: number_of_results,
          query: query,
          cuisine: cuisine,
          diet: diet,
          intolerances: intolerance,
          apiKey: process.env.spooncular_apiKey
      }
  });
}


/**
 * Retrieves recipe information for a specific recipe ID.
 * @param {string} recipe_id - The ID of the recipe to fetch details for.
 * @returns {Object} - Detailed information about the recipe.
 */
async function getRecipeInformation(recipe_id) {
  return await axios.get(`${api_domain}/${recipe_id}/information`, {
      params: {
          includeNutrition: false,
          apiKey: process.env.spooncular_apiKey
      }
  });
}

/**
 * Retrieves a preview of a list of recipes with limited details.
 * @param {Array} recipes_ids_list - An array of recipe IDs to fetch preview details for.
 * @param {number} user_id - The ID of the user requesting the preview (optional).
 * @returns {Array} - An array of recipes containing preview details.
 */
async function getRecipesPreview(recipes_ids_list,user_id) {
  let promises = [];
  recipes_ids_list.map((id) => {
      if(id > 0)
      {
          promises.push(getRecipeInformation(id));
      }
      else{
          promises.push(id);
      }
  });

  let info_res = await Promise.all(promises);
  return recipeDetails(info_res,user_id);
}

/**
 * Retrieves three random recipes.
 * @param {number} user_id - The ID of the user requesting the recipes (optional).
 * @returns {Array} - An array of three random recipes with preview details.
 */
async function getRandomRecipes(user_id) {
  const response = await axios.get(`${api_domain}/random`, {
    params: {
      number: 3,
      apiKey: process.env.spooncular_apiKey,
    },
  });
  recipes_arr = response.data.recipes;
  return recipeDetails([recipes_arr[0],recipes_arr[1],recipes_arr[2]],user_id);
}

/**
 * Checks if the user has seen a specific recipe.
 * @param {number} user_id - The ID of the user.
 * @param {string} recipe_id - The ID of the recipe to check.
 * @returns {Array} - An array with information about whether the user has seen the recipe.
 */
async function userSeenRecipe(user_id,recipe_id){
  return await DButils.execQuery(`select * from seen where user_id='${user_id}' and recipe_id='${recipe_id}'`);
}

/**
 * Checks if the user has marked a recipe as a favorite.
 * @param {number} user_id - The ID of the user.
 * @param {string} recipe_id - The ID of the recipe to check.
 * @returns {Array} - An array with information about whether the user has marked the recipe as a favorite.
 */
async function userFavoriteRecipe(user_id, recipe_id) {
  return await DButils.execQuery(`select * from favoriterecipes where user_id='${user_id}' and recipe_id='${recipe_id}'`);
}

/**
 * Retrieves detailed information for a specific recipe.
 * @param {string} recipe_id - The ID of the recipe to fetch details for.
 * @returns {Object} - Detailed information about the recipe.
 */
async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        recipe_id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        aggregateLikes: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
    }
}

/**
 * Extracts relevant details from the Spoonacular response for recipe preview.
 * @param {Array} recipes_info - An array of recipe information from the Spoonacular API.
 * @param {number} user_id - The ID of the user requesting the preview (optional).
 * @returns {Array} - An array of recipes containing relevant details for preview.
 */
async function extractPreviewRecipeDetails(recipes_info, user_id) {
  const processedRecipes = [];
  
  for (let i = 0; i < recipes_info.length; i++) {
    let data = recipes_info[i];
    if (recipes_info[i].data) {
      data = recipes_info[i].data;
    }
    
    const {
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
      analyzedInstructions,
      extendedIngredients
    } = data;
    
    let favorite = undefined;
    let seen= undefined;
    if (user_id) {
      let row_favorite =  await userFavoriteRecipe(user_id, id);
      let row_seen =  await userSeenRecipe(user_id, id);
      if (row_favorite[0] == null) {
        favorite = false;
      } else {
        favorite = true;
      }
      if (row_seen[0] == null) {
        seen = false;
      } else {
        seen = true;
      }
    }
    
    const processedRecipe = {
      id: id,
      title: title,
      readyInMinutes: readyInMinutes,
      image: image,
      aggregateLikes: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
      analyzedInstructions: analyzedInstructions,
      extendedIngredients: extendedIngredients,
      favorite: favorite,
      seen: seen
    };
    
    processedRecipes.push(processedRecipe);
  }
  return processedRecipes;
}

/**
 * Process recipe details and user-specific information to create a list of processed recipes.
 * This function takes in an array of recipe information and enriches it with user-specific details
 * like whether the recipe is marked as favorite or seen by the user.
 * @param {Array} recipes_info - An array of recipe information from the Spoonacular API.
 * @param {number} user_id - The ID of the user requesting the processed recipe details (optional).
 * @returns {Array} - An array of processed recipes containing relevant details and user-specific information.
 */
async function recipeDetails(recipes_info, user_id) {
  const processedRecipes = [];
  for (let i = 0; i < recipes_info.length; i++) {
    let data = recipes_info[i];
    if (recipes_info[i].data) {
      data = recipes_info[i].data;
    }   
    const {
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
      analyzedInstructions,
      extendedIngredients
    } = data;   
    let favorite = undefined;
    let seen= undefined;
    if (user_id) {
      let row_favorite =  await userFavoriteRecipe(user_id, id);
      let row_seen =  await userSeenRecipe(user_id, id);
      if (row_favorite[0] == null) {
        favorite = false;
      } else {
        favorite = true;
      }
      if (row_seen[0] == null) {
        seen = false;
      } else {
        seen = true;
      }
    }   
    const processedRecipe = {
      recipe_id: id,
      title: title,
      readyInMinutes: readyInMinutes,
      image: image,
      aggregateLikes: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
      favorite: favorite,
      seen: seen
    };
    
    processedRecipes.push(processedRecipe);
  } 
  return processedRecipes;
}

/**
 * Retrieves expanded recipe data, including servings amount, cooking instructions,
 * ingredients list, and amounts for a specific recipe.
 * @param {number} user_id - The ID of the user requesting the expanded details (optional).
 * @param {string} recipe_id - The ID of the recipe to fetch expanded details for.
 * @returns {Object} - Detailed information about the recipe with expanded details.
 */
async function getRecipeExpandedDetails(user_id,recipe_id) {
  let recipe_info = await getRecipeInformation(recipe_id);

  let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, analyzedInstructions, extendedIngredients, servings} = recipe_info.data;

  let favorite = undefined;
  let seen= undefined;
  if (user_id!=0) {
    let row_favorite =  await userFavoriteRecipe(user_id, id);
    let row_seen =  await userSeenRecipe(user_id, id);
    if (row_favorite[0] == null) {
      favorite = false;
    } else {
      favorite = true;
    }
    if (row_seen[0] == null) {
      seen = false;
    } else {
      seen = true;
    }
  }

  return {
      recipe_id: id,
      title: title,
      readyInMinutes: readyInMinutes,
      image: image,
      aggregateLikes: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree, 
      servings: servings,
      analyzedInstructions: analyzedInstructions,
      extendedIngredients: extendedIngredients,
      favorite: favorite,
      seen: seen
  }
}

/**
 * Retrieves expanded personal recipe data, including servings amount, cooking instructions,
 * ingredients list, and amounts for a specific personal recipe.
 * @param {string} recipe_id1 - The ID of the personal recipe to fetch details for.
 * @param {number} user_id1 - The ID of the user requesting the expanded details.
 * @returns {Object} - Detailed information about the personal recipe with expanded details.
 */
async function getRecipepersonalExpandedDetails(recipe_id1,user_id1) {
  const row_details=await DButils.execQuery(`select * from personalrecipes where user_id='${user_id1}' and recipe_id='${recipe_id1}'`);
  let { recipe_id,user_id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, servings,analyzedInstructions,extendedIngredients} = row_details[0];
  
  return {
      recipe_id: recipe_id,
      title: title,
      readyInMinutes: readyInMinutes,
      image: image,
      aggregateLikes: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree, 
      servings: servings,
      analyzedInstructions: analyzedInstructions,
      extendedIngredients: extendedIngredients,
  }
}

/**
 * Retrieves detailed information for a specific personal recipe.
 * @param {string} recipe_id1 - The ID of the personal recipe to fetch details for.
 * @param {number} user_id1 - The ID of the user requesting the details.
 * @returns {Object} - Detailed information about the personal recipe.
 */
async function getpersonalRecipeDetails(recipe_id1,user_id1) {
  const row_details=await DButils.execQuery(`select * from personalrecipes where user_id='${user_id1}' and recipe_id='${recipe_id1}'`);
  let { recipe_id,user_id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, servings,analyzedInstructions,extendedIngredients} = row_details[0];

  return {
      recipe_id: recipe_id,
      title: title,
      readyInMinutes: readyInMinutes,
      image: image,
      aggregateLikes: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
  }
}


// Exported functions
exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getSearchResults = getSearchResults;
exports.getRecipeExpandedDetails = getRecipeExpandedDetails;
exports.getpersonalRecipeDetails = getpersonalRecipeDetails;
exports.getRecipepersonalExpandedDetails = getRecipepersonalExpandedDetails;
