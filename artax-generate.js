#!/usr/bin/env node
// Node Modules
import { program } from 'commander';
import fs          from 'fs-extra';
import chalk       from 'chalk';

// Common Generators
import commonMixin    from './inc/blueprints/generate/common/scss-mixin.js';
import commonFunction from './inc/blueprints/generate/common/scss-function.js';

// Static HTML Generators
import staticHtmlComponent from './inc/blueprints/generate/static-html/component.js';
import staticHtmlPage      from './inc/blueprints/generate/static-html/page.js';

// Drupal Generators
import drupalComponent from './inc/blueprints/generate/drupal/component.js';
import drupalPage      from './inc/blueprints/generate/drupal/page.js';
import drupalMixin     from './inc/blueprints/generate/drupal/scss-mixin.js';
import drupalFunction  from './inc/blueprints/generate/drupal/scss-function.js';

// WordPress Generators
import wordpressComponent from './inc/blueprints/generate/wordpress/component.js';
import wordpressPage      from './inc/blueprints/generate/wordpress/page.js';
import wordpressTemplate  from './inc/blueprints/generate/wordpress/template.js';

program
  .option('--js', 'Create a JS partial for a component')
  .parse(process.argv)
;

// .artaxrc file
const rcFile = process.cwd() + '/.artaxrc';

// options
const options = program.opts();

// Make sure we're in the root of an artax project
if (!fs.existsSync(rcFile)) {
  console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + 'You must execute this command from the root of an artax project!\n');
  process.exit(1);
}

// what we're generating
const genType = program.args[0];

// the name of what we're generating
const genName = program.args[1];

// the project type we're in
const projectType = fs.readJsonSync(rcFile).projectType;

// error if no type of generator is entered
if (!genType) {
  console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + 'What you want to generate is required!\n');
  process.exit(1);
}

// error if no name of generator is entered
if (!genName) {
  console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + 'The name of what you want to generate is required!\n');
  process.exit(1);
}

// If JS Flag
const createJS = options.js;

// check project type
switch (projectType) {

  // static html project
  case 'Static HTML':

    // check generator type
    switch (genType) {

      // components
      case 'component':
        staticHtmlComponent(genName, createJS);
        break;

      // pages
      case 'page':
        staticHtmlPage(genName);
        break;

      // scss mixins
      case 'mixin':
        commonMixin(genName);
        break;

      // scss functions
      case 'function':
        commonFunction(genName);
        break;

      // error
      default:
        console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(genType) + ' is not a valid type to generate! Can be `' + chalk.bold.cyan('component') + '`, `' + chalk.bold.cyan('page') + '`, `' + chalk.bold.cyan('mixin') + '` or `' + chalk.bold.cyan('function') + '`.\n');
        process.exit(1);
    }
    break;

  // Drupal project
  case 'Drupal':

    // check generator type
    switch (genType) {

      // components
      case 'component':
        drupalComponent(genName, createJS);
        break;

      // pages
      case 'page':
        drupalPage(genName);
        break;

      // scss mixins
      case 'mixin':
        drupalMixin(genName);
        break;

      // scss functions
      case 'function':
        drupalFunction(genName);
        break;

      // error
      default:
        console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(genType) + ' is not a valid type to generate! Can be `' + chalk.bold.cyan('component') + '`, `' + chalk.bold.cyan('page') + '`, `' + chalk.bold.cyan('mixin') + '` or `' + chalk.bold.cyan('function') + '`.\n');
        process.exit(1);
    }
    break;

  // wordpress project
  case 'WordPress':

    // check generator type
    switch (genType) {

      // components
      case 'component':
        wordpressComponent(genName, createJS);
        break;

      // pages
      case 'page':
        wordpressPage(genName);
        break;

      // templates
      case 'template':
        wordpressTemplate(genName);
        break;

      // scss mixins
      case 'mixin':
        commonMixin(genName);
        break;

      // scss functions
      case 'function':
        commonFunction(genName);
        break;

      // error
      default:
        console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(genType) + ' is not a valid type to generate! Can be `' + chalk.bold.cyan('component') + '`, `' + chalk.bold.cyan('page') + '`, `' + chalk.bold.cyan('template') + '`, `' + chalk.bold.cyan('mixin') + '` or `' + chalk.bold.cyan('function') + '`.\n');
        process.exit(1);
    }
    break;

  // other project types
  default:
    console.log('\nPut commands in here after defining ' + projectType + ' requirements!\n');
}
