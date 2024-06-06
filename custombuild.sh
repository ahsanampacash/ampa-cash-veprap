#!/bin/sh
ng build angular-app --prod --output-hashing=none && cat dist/angular-app/runtime-es5.js dist/angular-app/polyfills-es5.js dist/angular-app/scripts.js dist/angular-app/main-es5.js > preview/angularapp.js
