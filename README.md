# Recipe Project API

A full-stack web application that allows users to discover, save, and cook recipes. The backend (this repository) is built with Node.js, Express, and MySQL. It exposes a RESTful API for user authentication, recipe search (powered by Spoonacular), favorites, meal planning, and cooking progress tracking.

---

## Features

- **User Management**  
  - Registration and login  
  - Password validation and session handling  

- **Recipe Discovery**  
  - Fetch random recipes or search by name, cuisine, diet, and intolerances  
  - Retrieve detailed recipe information (ingredients, instructions, servings, etc.) via Spoonacular API  

- **Favorites & Last Viewed**  
  - Add/remove recipes to a user’s favorites list  
  - Track and retrieve the last viewed recipes  

- **Meal Planning**  
  - Add recipes to a “meal plan”  
  - Reorder or remove recipes within your plan  
  - Persisted per user in the database  

- **Making Progress**  
  - Fetch analyzed instructions (step-by-step cooking guide)  
  - Save and update user’s progress through each step  
  - Adjust ingredient quantities based on servings  

---

## Tech Stack

- **Backend**:  
  - Node.js (v14+)  
  - Express.js  
  - Axios (for external HTTP requests)  

- **Database**:  
  - MySQL (v8+)  
  - `usermeal`, `users`, `recipes`, and other tables as defined in `/sql scripts/Select.sql`  

- **External API**:  
  - Spoonacular Recipe & Food API (for recipe details, analyzed instructions, etc.)  

---

## Repository Structure

```
├── routes/
│   ├── auth.js                 # Login, logout, registration
│   ├── recipes.js              # Endpoints for random, search, preview, recipe details
│   ├── user.js                 # Endpoints for favorites, last viewed, meal plan, cooking progress
│   └── utils/
│       ├── DButils.js          # MySQL connection and query wrapper
│       ├── MySql.js            # Database initialization (pool) 
│       ├── recipes_utils.js    # Helper functions for interacting with Spoonacular API
│       └── user_utils.js       # CRUD functions for user data (favorites, meal, progress)
│
├── sql scripts/
│   └── Select.sql              # Table definitions and initial queries
│
├── index.html                  # Auto-generated API documentation (Swagger-style)
├── RecipeWebsiteProjectAPI.yaml# OpenAPI specification 
├── .env                        # environment variables file
├── package.json
└── README.md                   # (This file)
```

---

## Prerequisites

1. **Node.js** (v14 or above)  
2. **MySQL** (v8 or above)  
3. **Spoonacular API Key** (sign up at [Spoonacular](https://spoonacular.com/food-api) to get your free key)  

---

## Installation & Setup

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/WED-2023/assignment3-2-207761024_314804287_assignment2
   cd RecipeWebsiteProjectAPI
   ```

2. **Install Dependencies**  
   ```bash
   npm install
   ```

3. **Create & Configure MySQL Database**  
   - Launch your MySQL server and create a new database, e.g.:  
     ```sql
     CREATE DATABASE recipe_db;
     ```
   - Run the SQL scripts to create tables and seed initial data:  
     ```bash
     mysql -u <your_mysql_user> -p recipe_db < "sql scripts/Select.sql"
     ```

4. **Configure Environment Variables**  
   - Copy `.env.example` to `.env` and fill in your own values:  
     ```ini
     PORT=3000
     DB_HOST=localhost
     DB_USER=your_mysql_user
     DB_PASSWORD=your_mysql_password
     DB_NAME=recipe_db

     SPOONACULAR_API_KEY=your_spoonacular_api_key
     SESSION_SECRET=someRandomSecretString
     ```
   - Example `.env.example`:  
     ```ini
     PORT=3000
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=Password123!
     DB_NAME=recipe_db

     SPOONACULAR_API_KEY=abc123def456
     SESSION_SECRET=replaceWithYourOwnSecret
     ```

5. **Start the Server**  
   ```bash
   npm start
   ```
   By default the server will run on `http://localhost:3000/`.

---

## API Documentation

All endpoints are documented in **Swagger-style** under `index.html`. After starting the server, open a browser and navigate to:

```
http://localhost:3000/index.html
```

This page contains a full list of available routes, request/response examples, and model schemas. You can also refer to the `RecipeWebsiteProjectAPI.yaml` file for the OpenAPI specification if you prefer tools like Postman or Swagger UI.

---

## Usage Examples

Below are a few common API calls (assume `http://localhost:3000` as the base URL):

1. **Register / Login**  
   ```http
   POST /register
   Content-Type: application/json

   {
     "username": "shayhar",
     "firstname": "Shay",
     "lastname": "Harush",
     "country": "Israel",
     "password": "Passw0rd!",
     "passwordConfirmation": "Passw0rd!",
     "email": "shay.har@example.com"
   }
   ```

   ```http
   POST /login
   Content-Type: application/json

   {
     "username": "shayhar",
     "password": "Passw0rd!"
   }
   ```

2. **Search for Recipes**  
   ```http
   GET /search?recipeName=chicken&cuisine=American&diet=Gluten Free&number=10
   ```

3. **Add a Recipe to Favorites**  
   ```http
   POST /FavoritesRecipes
   Content-Type: application/json

   {
     "recipeId": 160303
   }
   ```

4. **Fetch Analyzed Instructions & Progress**  
   ```http
   GET /RecipeMaking/160303
   ```
   Response:
   ```json
   {
     "instructions": [
       {
         "name": "",
         "steps": [
           {
             "number": 1,
             "step": "Preheat oven to 350°F …",
             "ingredients": [ /* … */ ],
             "equipment": [ /* … */ ]
           },
           { /* … */ }
         ]
       }
     ],
     "recipe_progress": [true, false, true, /* … */]
   }
   ```

5. **Update Cooking Progress**  
   ```http
   PUT /RecipeMaking
   Content-Type: application/json

   {
     "recipeId": 160303,
     "recipe_progress": [true, true, false, /* … */]
   }
   ```

---

## Environment Variables

| Variable               | Description                                           |
|------------------------|-------------------------------------------------------|
| `PORT`                 | Port number on which the server will listen (e.g., 3000) |
| `DB_HOST`              | MySQL host (e.g., `localhost`)                        |
| `DB_USER`              | MySQL username                                        |
| `DB_PASSWORD`          | MySQL password                                        |
| `DB_NAME`              | MySQL database name (e.g., `recipe_db`)               |
| `SPOONACULAR_API_KEY`  | Your Spoonacular API key                              |
| `SESSION_SECRET`       | A random string used to sign session cookies          |

---

## Running Locally vs. Production

- **Local Development**  
  - Ensure your `.env` is configured  
  - Run `npm start` (or `npm run dev` if using a watcher like Nodemon)  
  - Use a tool like Postman or the built-in `index.html` docs for testing  

- **Production Deployment**  
  - Build or deploy to your preferred hosting platform (Heroku, AWS, DigitalOcean, etc.)  
  - Set environment variables in your hosting environment  
  - Make sure your database credentials and Spoonacular key are secured  

---

## Testing

- Unit tests and integration tests can be added under a `/tests` folder.  
- To run tests (once implemented):  
  ```bash
  npm test
  ```

*(At present, no automated tests are included. Feel free to add Jest or Mocha/Chai suites.)*

---

## Contributing

1. Fork this repository  
2. Create a feature branch (`git checkout -b feature/your-feature`)  
3. Commit your changes (`git commit -m "Add some feature"`)  
4. Push to the branch (`git push origin feature/your-feature`)  
5. Open a Pull Request against the `main` branch  

Please follow standard linting and coding conventions (prettier, ESLint, etc.) before submitting.

---

## License

This project is licensed under the [Apache License 2.0](http://apache.org/licenses/LICENSE-2.0.html). All rights reserved.

---

## Contact

- **Project Lead**: Shay Harush & Noam Tarshish  
- **Email**: shayhar@post.bgu.ac.il & Noamtars@post.bgu.ac.il
- **Repository**: https://github.com/WED-2023/assignment3-2-207761024_314804287_assignment2  

Feel free to open an issue or submit a pull request if you find bugs or want to suggest improvements. Enjoy cooking!
