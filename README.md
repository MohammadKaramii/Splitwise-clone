# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
};
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

# React Vite App with Supabase and Recaptcha

This is a React project bootstrapped with Vite that integrates with Supabase for backend operations and Recaptcha for security. In order to run this app successfully, you will need to provide the Supabase URL, Supabase Anon Key, and Recaptcha Site Key.

## Prerequisites

Before running the application, make sure you have the following keys ready:

- Supabase URL
- Supabase Anon Key
- Recaptcha Site Key

## Getting Started

1. Clone this repository to your local machine.
2. Navigate to the project directory.

3. Install dependencies using npm:

````bash
npm install
Create a .env file in the root of the project.

Add the following environment variables to the .env file:


Copy code
# Supabase Config
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Recaptcha Config
VITE_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY
Replace YOUR_SUPABASE_URL, YOUR_SUPABASE_ANON_KEY, and YOUR_RECAPTCHA_SITE_KEY with your actual Supabase URL, Supabase Anon Key, and Recaptcha Site Key respectively.

Start the development server:

```bash
npm run dev
Open your browser and navigate to http://localhost:3000 to view the app.
Additional Information
For more details on Supabase, visit Supabase Documentation.
For Recaptcha integration, refer to Google Recaptcha Documentation.
Feel free to customize and build upon this project according to your requirements!
````
