var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

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

/**
 * BONUS!!!!! This path add the recipe to the planning meal.
 */
router.post('/addrecipetomeal/:recipeId', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipeId;
    await user_utils.addRecipeToMeal(user_id,recipe_id);
    res.status(200).send("The Recipe successfully added to the plainning meal");
    } catch(error){
    next(error);
  }
})

router.post('/deleterecipetomeal/:recipeId', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipeId;
    await user_utils.deleteRecipeToMeal(user_id,recipe_id);
    res.status(200).send("The Recipe successfully deleted from the plainning meal");
    } catch(error){
    next(error);
  }
})

router.post('/cleanrecipetomeal', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    await user_utils.cleanRecipeToMeal(user_id);
    res.status(200).send("The plainning meal clean");
    } catch(error){
    next(error);
  }
})

/**
 * END BONUS!!!!!
 */


/**
 * Q11- This path returns all users personal recipes.
 * example- localhost:3000/users/getpersonalrecipebyid/1
 */
router.get('/getpersonalrecipebyid/:recipeId', async (req,res,next) => {
  try {
    const recipe = await recipe_utils.getpersonalRecipeDetails(req.params.recipeId,req.session.user_id);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
  });

/**
 * Q11- This path returns all users personal recipes.
 * example- localhost:3000/users/getpersonalrecipe
 */
router.get('/getpersonalrecipe', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const response = await user_utils.getPersonalRecipes(user_id);
    res.status(200).send(response);
  } catch(error){
    next(error); 
  }
  });

/**
 * Q9- This path add new recipe in the personal recipes DB.
 * example- localhost:3000/users/addpersonalrecipe
 * {
        "title": "Pasta of mama9",
        "readyInMinutes": 40,
        "image": "https://spoonacular.com/recipeImages/654959-556x370.jpg",
        "aggregateLikes": 2,
        "vegan": false,
        "vegetarian": false,
        "glutenFree": false,
        "servings": 3,
        "analyzedInstructions": "aaa",
        "extendedIngredients": "bbb"
}
 */
router.post('/addpersonalrecipe', async (req,res,next) => {
  try{
    // add default image in case the user didn't give one
    image = req.body.image;
    if(image == undefined)
    {
      image = "https://spoonacular.com/recipeImages/2225-556x370.jpg";
    }
    const response = await user_utils.addPersonalRecipe(req.session.user_id,req.body.title, req.body.readyInMinutes, image, req.body.aggregateLikes, req.body.vegan, req.body.vegetarian, req.body.glutenFree, req.body.servings, req.body.analyzedInstructions, req.body.extendedIngredients);
    res.status(200).send(response);
    } catch(error){
    next(error);
  }
})


/**
 * Q12- This path returns the family recipes of the connect user.
 * example- localhost:3000/users/getfamilyrecipes
 */
router.get('/getfamilyrecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const response = await user_utils.getFamilyRecipes(user_id);
    res.status(200).send(response);
  } catch(error){
    next(error); 
  }
});

/**
 * Q6-This path returns the last three recipe's viewed by the connect user. 
 * example- localhost:3000/users/getThreeLast
 */
router.get("/getThreeLast", async (req, res, next) => { 
  try {
    try{
      let user_id = req.session.user_id;
      recipes_id = await user_utils.getThreeLastOfUser(user_id);
      let results;
      try{
         results = await recipe_utils.getRecipesPreview(recipes_id,user_id);
      }
      catch (error) {
        res.send({ failure: true, message: "can't retrive these recipes details" });
      } 
      if(results.length==0)
       res.status(200).send([]);
      else
      {
        res.status(200).send(results);
      }
    }
    catch (error) {
      res.send({ failure: true, message: "you should first log in the site" });
    }  
     
  } catch (error) {
    next(error);
  }
});

/**
 * Q10- This path gets body with recipeId and save this recipe in the favorites list of the logged-in user.
 * example- localhost:3000/users/addtofavorites
 * {
    "recipeId": "202"
    }
 */
router.post('/addtofavorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * Q10- This path returns the favorites recipes that were saved by the logged-in user.
 * example- localhost:3000/users/getfavorites
 */
router.get('/getfavorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array,user_id);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

module.exports = router;
