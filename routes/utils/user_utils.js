const DButils = require("./DButils");

/**
 * Marks a recipe as favorite for a specific user.
 * @param {number} user_id - The ID of the user.
 * @param {string} recipe_id - The ID of the recipe to mark as favorite.
 */
async function markAsFavorite(user_id, recipe_id){
    const recipe_fav = (
        await DButils.execQuery(
            `select * from favoriterecipes where user_id='${user_id}' AND recipe_id='${recipe_id}'`
        )
    );
    if(recipe_fav.length==0){
        await DButils.execQuery(`insert into favoriterecipes values ('${user_id}','${recipe_id}')`);
    }
}

/**
 * Retrieves the list of favorite recipes for a specific user.
 * @param {number} user_id - The ID of the user.
 * @returns {Array} - An array of recipe IDs that are marked as favorite by the user.
 */
async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from favoriterecipes where user_id='${user_id}'`);
    return recipes_id;
}
/**
 * Adds a personal recipe to the user's collection.
 * @param {number} user_id - The ID of the user.
 * @param {string} title - The title of the personal recipe.
 * @param {number} readyInMinutes - The preparation time in minutes for the personal recipe.
 * @param {string} image - The image URL of the personal recipe.
 * @param {number} aggregateLikes - The number of likes for the personal recipe.
 * @param {boolean} vegan - Indicates if the personal recipe is vegan.
 * @param {boolean} vegetarian - Indicates if the personal recipe is vegetarian.
 * @param {boolean} glutenFree - Indicates if the personal recipe is gluten-free.
 * @param {number} servings - The number of servings for the personal recipe.
 * @param {string} analyzedInstructions - The cooking instructions for the personal recipe.
 * @param {string} extendedIngredients - The list of ingredients for the personal recipe.
 * @returns {string} - A message indicating the success of adding the personal recipe.
 */
async function addPersonalRecipe(user_id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, servings, analyzedInstructions, extendedIngredients){ 
    // await DButils.execQuery(
    //     `INSERT INTO personalrecipes (user_id, title, readyInMinutes, image, aggregateLikes,vegan, vegetarian, glutenFree, servings, analyzedInstructions, extendedIngredients) VALUES ('${user_id}','${title}', '${readyInMinutes}', '${image}','${aggregateLikes}', ${vegan}, ${vegetarian}, ${glutenFree}, '${servings}', '${analyzedInstructions}', '${extendedIngredients}')`
    // );

    const counter = (
        await DButils.execQuery(
            `SELECT COUNT(*) as counts FROM personalrecipes`
        )
        )[0];

    await DButils.execQuery(
        `INSERT INTO personalrecipes VALUES ('${(counter.counts + 1)}','${user_id}','${title}', '${readyInMinutes}', '${image}',
        '${aggregateLikes}', ${vegan}, ${vegetarian}, ${glutenFree}, ${servings}, '${analyzedInstructions}', '${extendedIngredients}')`
    );

    // await DButils.execQuery(`INSERT INTO personalrecipes (user_id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, servings, analyzedInstructions, extendedIngredients)
    // VALUES (2, 'moria', 30, 'pasta.jpg', 50, 0, 1, 1, 4, 'Cook pasta according to package instructions. In a separate pan, sauté onions and garlic. Add cooked pasta, tomatoes, and basil. Mix well and serve hot.', 'Pasta, Onions, Garlic, Tomatoes, Basil')`);

    return "The Recipe successfully saved in your personal recipes list";
}

/**
 * Retrieves the list of personal recipes for a specific user.
 * @param {number} user_id - The ID of the user.
 * @returns {Array} - An array of personal recipes with preview details.
 */
async function getPersonalRecipes(user_id){
    const recipes = (
        await DButils.execQuery(
            `select * from personalrecipes where user_id='${user_id}' `
        )
    );
    reciped_preview = []
    for (let i = 0; i < recipes.length; i++) {
        let {recipe_id, user_id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree ,servings,analyzedInstructions,extendedIngredients} = recipes[i];
    
        reciped_preview[i] = {
            recipe_id:recipe_id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            aggregateLikes: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree, 
        }
    }
    return reciped_preview;
    
}
/**
 * Adds a recipe to the user's history of viewed recipes.
 * @param {number} user_id - The ID of the user.
 * @param {string} recipe_id - The ID of the recipe viewed by the user.
 */
async function addToThreeLastOfUser(user_id, recipe_id){
    let recipe_check = await DButils.execQuery(`select * from historyofuser where user_id='${user_id}'`);
    if (recipe_check.length==0){
        await DButils.execQuery(
            `INSERT INTO historyofuser (user_id,last1,last2,last3) VALUES ('${user_id}','${recipe_id}','${0}','${0}')`
        );
    }
    //[-,-,-]
    else if(recipe_check[0].last1 == 0 && recipe_check[0].last2 == 0 && recipe_check[0].last3 == 0){
        await DButils.execQuery(`UPDATE historyofuser SET last1='${recipe_id}',last2='${0}', last3='${0}' WHERE user_id='${user_id}'`);
    }
    //[X,-,-]
    else if(recipe_check[0].last1 != 0 && recipe_check[0].last1 != recipe_id && recipe_check[0].last2 == 0 && recipe_check[0].last3 == 0){
        await DButils.execQuery(`UPDATE historyofuser SET last1='${recipe_id}',last2='${recipe_check[0].last1}', last3='${0}' WHERE user_id='${user_id}'`);
    }
    //[X,Y,-]
    else if(recipe_check[0].last1 != 0 && recipe_check[0].last2 != 0 && recipe_check[0].last3 == 0){
        if(recipe_check[0].last1 != recipe_id && recipe_check[0].last2 != recipe_id){
            await DButils.execQuery(`UPDATE historyofuser SET last1='${recipe_id}',last2='${recipe_check[0].last1}', last3='${recipe_check[0].last2}' WHERE user_id='${user_id}'`);
        }
        else if(recipe_check[0].last1 != recipe_id && recipe_check[0].last2 == recipe_id){
            await DButils.execQuery(`UPDATE historyofuser SET last1='${recipe_id}',last2='${recipe_check[0].last1}', last3='${recipe_check[0].last2}' WHERE user_id='${user_id}'`);
        }
    }
    //[X,Y,Z]
    else if(recipe_check[0].last1 != 0 && recipe_check[0].last2 != 0 && recipe_check[0].last3 != 0){
        if(recipe_check[0].last1 != recipe_id && recipe_check[0].last2 != recipe_id){
            await DButils.execQuery(`UPDATE historyofuser SET last1='${recipe_id}',last2='${recipe_check[0].last1}', last3='${recipe_check[0].last2}' WHERE user_id='${user_id}'`);
        }
        else if(recipe_check[0].last1 != recipe_id && recipe_check[0].last2 == recipe_id&& recipe_check[0].last3 != recipe_id){
            await DButils.execQuery(`UPDATE historyofuser SET last1='${recipe_id}',last2='${recipe_check[0].last1}', last3='${recipe_check[0].last3}' WHERE user_id='${user_id}'`);
        }
        
    }
}
/**
 * Retrieves the last three viewed recipes of a specific user.
 * @param {number} user_id - The ID of the user.
 * @returns {Array} - An array of the last three viewed recipe IDs by the user.
 */
async function getThreeLastOfUser(user_id){
    let Viewed=[]
    let recipe_check = await DButils.execQuery(`select last1, last2, last3 from historyofuser where user_id='${user_id}'`);
    if(recipe_check[0].last1 != 0 && recipe_check[0].last2 == 0 && recipe_check[0].last3 == 0){
        Viewed.push(recipe_check[0].last1)
    }
    else if(recipe_check[0].last1 != 0 && recipe_check[0].last2 != 0 && recipe_check[0].last3 == 0){
        Viewed.push(recipe_check[0].last1)
        Viewed.push(recipe_check[0].last2)

    }
    else if(recipe_check[0].last1 != 0 && recipe_check[0].last2 != 0 && recipe_check[0].last3 != 0){
        Viewed.push(recipe_check[0].last1)
        Viewed.push(recipe_check[0].last2)
        Viewed.push(recipe_check[0].last3)
    }
    return Viewed;
}
/**
 * Updates the seen history for a specific user and recipe.
 * @param {number} user_id - The ID of the user.
 * @param {string} recipe_id - The ID of the recipe viewed by the user.
 */
async function updateseen(user_id, recipe_id){
    const recipe_info = (
        await DButils.execQuery(
            `select * from seen where user_id='${user_id}' AND recipe_id='${recipe_id}'`
        )
    );
    if(recipe_info.length==0){
        await DButils.execQuery(`insert into seen values ('${user_id}','${recipe_id}')`);
    }
}
/**
 * Retrieves the list of family recipes for a specific user.
 * @param {number} user_id - The ID of the user.
 * @returns {Array} - An array of family recipes with details.
 */
async function getFamilyRecipes(user_id){
    const recipes=await DButils.execQuery(`select * from familyrecipes where user_id='${user_id}'`);
    if(recipes.length == 0)
    {
        return [];
    }
    let recipe_1 = recipes[0];
    let recipe_2 = recipes[1];
    let recipe_3 = recipes[2];

    const response = 
    [
        {
            recipe_id: recipe_1.recipe_id,
            title: recipe_1.title,
            owner: recipe_1.owner,
            when_used: recipe_1.when_used,
            ingredients: recipe_1.ingredients,
            analyzedInstructions: recipe_1.analyzedInstructions,
            image: recipe_1.image,
        },
        {
            recipe_id: recipe_2.recipe_id,
            title: recipe_2.title,
            owner: recipe_2.owner,
            when_used: recipe_2.when_used,
            ingredients: recipe_2.ingredients,
            analyzedInstructions: recipe_2.analyzedInstructions,
            image: recipe_2.image,
        },
        {
            recipe_id: recipe_3.recipe_id,
            title: recipe_3.title,
            owner: recipe_3.owner,
            when_used: recipe_3.when_used,
            ingredients: recipe_3.ingredients,
            analyzedInstructions: recipe_3.analyzedInstructions,
            image: recipe_3.image,
        }
    ]

    return response;
}
/**
 * Adds a recipe to the user's meal plan.
 * @param {number} user_id - The ID of the user.
 * @param {string} recipe_id - The ID of the recipe to add to the meal plan.
 */
async function addRecipeToMeal(user_id, recipe_id){
    const recipe = (
        await DButils.execQuery(
            `select * from planmeal where user_id='${user_id}' AND recipe_id='${recipe_id}'`
        )
    );
    if(recipe.length==0){
        await DButils.execQuery(`insert into planmeal values ('${user_id}','${recipe_id}')`);
    }
}
/**
 * Deletes a recipe from the user's meal plan.
 * @param {number} user_id - The ID of the user.
 * @param {string} recipe_id - The ID of the recipe to delete from the meal plan.
 */
async function deleteRecipeToMeal(user_id, recipe_id){
    await DButils.execQuery(`DELETE FROM planmeal where user_id='${user_id}' AND recipe_id='${recipe_id}'`)
}

/**
 * Clears the user's meal plan.
 * @param {number} user_id - The ID of the user.
 */
async function cleanRecipeToMeal(user_id){
    await DButils.execQuery(`DELETE FROM planmeal where user_id='${user_id}'`)
}
// Exported functions
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getThreeLastOfUser = getThreeLastOfUser;
exports.getFamilyRecipes = getFamilyRecipes;
exports.addPersonalRecipe = addPersonalRecipe;
exports.getPersonalRecipes = getPersonalRecipes;
exports.addToThreeLastOfUser = addToThreeLastOfUser;
exports.updateseen = updateseen;
exports.addRecipeToMeal = addRecipeToMeal;
exports.deleteRecipeToMeal = deleteRecipeToMeal;
exports.cleanRecipeToMeal = cleanRecipeToMeal;
