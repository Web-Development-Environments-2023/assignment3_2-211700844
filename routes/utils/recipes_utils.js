const axios = require("axios");
const nodemon = require("nodemon");
const DButils = require("./DButils");
const api_domain = "https://api.spoonacular.com/recipes";


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

// Get recipe information for group of ids 
async function getRecipesInfoBulks(ids) {
  return await axios.get(`${api_domain}/informationBulk`, {
      params: {
          ids: ids,
          apiKey: process.env.spooncular_apiKey
      }
  });
}

// search for recipes by using: given_query as string to search, return  number_of_wanted_results results
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
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */
async function getRecipeInformation(recipe_id) {
  return await axios.get(`${api_domain}/${recipe_id}/information`, {
      params: {
          includeNutrition: false,
          apiKey: process.env.spooncular_apiKey
      }
  });
}

// get the preview of list of recipes
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
 * @returns three random recipes.
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

async function userSeenRecipe(user_id,recipe_id){
  return await DButils.execQuery(`select * from seen where user_id='${user_id}' and recipe_id='${recipe_id}'`);
}


async function userFavoriteRecipe(user_id, recipe_id) {
  return await DButils.execQuery(`select * from favoriterecipes where user_id='${user_id}' and recipe_id='${recipe_id}'`);
}


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

// Get expanded recipe data - input = recipe ID, output = preview details + servings amount, cooking instructions, ingredients list & amounts
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

// Get expanded recipe data of personal - input = recipe ID, output = preview details + servings amount, cooking instructions, ingredients list & amounts
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



exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getSearchResults = getSearchResults;
exports.getRecipeExpandedDetails = getRecipeExpandedDetails;
exports.getpersonalRecipeDetails = getpersonalRecipeDetails;
exports.getRecipepersonalExpandedDetails = getRecipepersonalExpandedDetails;
