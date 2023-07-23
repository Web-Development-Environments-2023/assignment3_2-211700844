var express = require("express"); 
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");

router.get("/", (req, res) => res.send("im here"));

/**
 * Q11- This path returns recipe's preview details of personal recipes + expanded data: servings amount, cooking instructions, ingredients list & amounts 
 * example- localhost:3000/recipes/expandepersonalRecipeData/1
*/
router.get("/expandepersonalRecipeData/:recipeID", async (req, res, next) => {
  try {
    let recipeID=req.params.recipeID;
    let recipe = await recipes_utils.getRecipepersonalExpandedDetails(recipeID,req.session.user_id);
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});

/**
 * Q7- This path returns recipe's preview details + expanded data: servings amount, cooking instructions, ingredients list & amounts.
 * example- localhost:3000/recipes/expandeRecipeData/17
 */
router.get("/expandeRecipeData/:recipeId", async (req, res, next) => {
  try {
    let user_id;
    if(req.session && req.session.user_id){
      user_id = req.session.user_id;
    }
    else{
      user_id=0
    }
    let recipeID1=req.params.recipeId;
    let recipe = await recipes_utils.getRecipeExpandedDetails(user_id,recipeID1);
    try{
      if(user_id!=0){
        await user_utils.addToThreeLastOfUser(user_id,recipeID1);
        await user_utils.updateseen(user_id,recipeID1); // adding to the history table
      }
      res.status(200).send(recipe);
    }
    catch (error) {
      res.send({ failure: true, message: error.message });
      }    

  } catch (error) {
    next(error);
  }
});

/**
 * Q8- search for recipes.
 * example- localhost:3000/recipes/search?query=pasta&number=5
 */
router.get("/search", async (req, res, next) => {
  try {
    //adding field to seission for saving last searches
    if (req.session && req.session.user_id) {
      req.session.last_search=req.query.getSearchResults
    }

    // by default: number = 5
    let number;
    if(!req.query.number){
      number=5;
    }
    else{
      if(req.query.number!=15 && req.query.number!=10 && req.query.number!=5){
        number=5;
      }
      else{
        number = req.query.number;
      }
    }

    // include Search - filtering parameters
    let search_results = await recipes_utils.getSearchResults(req.session.user_id,req.query.query,req.query.sort, number, req.query.cuisine, req.query.diet, req.query.intolerance);
    if(search_results.length==0){
      res.send("No matching search results were found");
    }
    else{
      res.send(search_results);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Q6- Random: return three random recipes.
 * example- localhost:3000/recipes/random
 */
router.get("/random", async (req, res, next) => {
  try {
    let user_id = req.session.user_id;
    let random_recipes = await recipes_utils.getRandomRecipes(user_id);
    res.status(200).send(random_recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a full details of a recipe by its id.
 * example- localhost:3000/recipes/100
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
