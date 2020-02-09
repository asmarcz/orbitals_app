# About
Repository for https://orbitals.app

Orbitals.app can be used to learn the electron configurations of elements of periodic table, see how their orbitals look in space and test your knowledge about them. 

# Build
In the root of cloned repository run:
1. `npm install`
1. `node bin/build.js --WVars`

The `www` (dist) directory is now deployable. 

# Options

Flag `--dev` watches for changes on files in schema.

Flag `--WVars` makes errors for not defined variables only warnings.

To use development mode successfully you will currently need both flags because some variables need empty string as default:

`node bin/build.js --dev --WVars`

# Web server

For simple web server run:

`php -S localhost:8000 bin/router.php -t www/`
