# AngularApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.4.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Generate VEPRAP JS file

To generate the .js file of veprap, you will need to execute the following command after you setup Node 16 version atleast:

Command: ng build angular-app --output-hashing=none --prod; Get-Content dist/angular-app/runtime-es2015.js, dist/angular-app/polyfills-es2015.js, dist/angular-app/main-es2015.js | Set-Content preview/veprap.js

This will first build the project and then combine all the javascript files i.e. main-es2015.js, runtime-es2015.js, and polyfills-es2015.js

This will generate the veprap.js minified file in preview folder on root.