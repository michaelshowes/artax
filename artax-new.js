#!/usr/bin/env node
import { program }        from 'commander';
import inquirer           from 'inquirer';
import validatePkgName    from 'validate-npm-package-name';
import chalk              from 'chalk';
import figlet             from 'figlet';
import clear              from 'clear';
import path               from 'path';
import fs                 from 'fs-extra';
import { readFile }       from 'fs/promises';
import drupalGenerator    from './inc/blueprints/new/drupal.js';
import staticGenerator    from './inc/blueprints/new/static-html.js';
import wordPressGenerator from './inc/blueprints/new/wordpress.js';

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

program.parse(process.argv);

clear();
console.log(chalk.bgBlue('                                                         '));
console.log(
  chalk.bold.bgBlue(
    figlet.textSync(' Artax ', {
      horizontalLayout: 'default',
      font: 'Colossal'
    })
  )
);
console.log(chalk.bgBlue('             By Interactive Strategies ' + 'v' + pkg.version + '            '));
console.log(chalk.bgBlue('                                                         '));
console.log();

let currentConfig = {};

inquirer
  .prompt([
    {
      name: 'projectType',
      message: 'What type of project are you creating?',
      type: 'rawlist',
      choices: (answers) => {
        let options = [];
        for (const key in pkg.config) {
          options.push(pkg.config[key].label);
        }

        return options;
      },
      filter: function (input) {

        let configKey = false;
        switch (input) {
          case 'Static HTML':   configKey = 'staticHtml'; break;
          case 'WordPress':     configKey = 'wordpress'; break;
          case 'Drupal':        configKey = 'drupal'; break;
        }

        currentConfig = pkg.config[configKey];

        return input;
      },
    },
    {
      name: 'projectName',
      message: 'What is the name of the project?',
      type: 'input',
      validate: (projectName) => {
        const valid = validatePkgName(projectName);
        if (valid.validForNewPackages === true) {
          return true;
        }
        if (valid.errors) {
          return chalk.red(valid.errors.join('\n'));
        }
        if (valid.warnings) {
          return chalk.red(valid.warnings.join('\n'));
        }
      }
    },
    {
      name: 'domainName',
      message: 'What domain do you want to use? (i.e. website.com). The domain will be accessible at local.website.com with local. prepended automatically.',
      type: 'input',
      when: (answers) => {
        return answers.projectType === 'WordPress';
      }
    },
    {
      name: 'projectDescription',
      message: 'What is the description of the project?',
      type: 'input',
    },
    {
      name: 'branch',
      message: 'What boilerplate branch would you like to use?',
      type: 'rawlist',
      default: 0,
      choices: () => {
        return currentConfig.branches;
      },
      when: () => {
        return currentConfig.branches.length > 1;
      }
    }
  ])
  .then((response) => {

    response.projectDir = path.resolve(response.projectName);
    response.vcsRepo = currentConfig.repo;
    response.vcsBranch = currentConfig.branches[0];

    if (response.branch) {
      response.vcsBranch = response.branch;
    }

    delete response.branch;

    switch (response.projectType) {
      case 'Drupal':
        drupalGenerator(response);
        break;
      case 'Static HTML':
        staticGenerator(response);
        break;
      case 'WordPress':
        wordPressGenerator(response);
        break;
    }

  });
