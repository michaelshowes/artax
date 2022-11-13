import { program }                                               from 'commander';
import inquirer                                                  from 'inquirer';
import validatePkgName                                           from 'validate-npm-package-name';
import chalk                                                     from 'chalk';
import clear                                                     from 'clear';
import fs                                                        from 'fs-extra';
import path                                                      from 'path';
import { execSync }                                              from 'child_process';
import replaceInFile                                             from 'replace-in-file';
import Renamer                                                   from 'renamer';
import { capitalCase, noCase, paramCase, pascalCase, snakeCase } from 'change-case';
import { readFile }                                              from 'fs/promises';

const RenameFiles = new Renamer();

const pkg = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url)));

export default (response) => {

  const projectType        = response.projectType;
  const projectName        = response.projectName;
  const projectDir         = response.projectDir;
  const projectDescription = response.projectDescription;
  const vcsRepo            = response.vcsRepo;
  const vcsBranch          = response.vcsBranch;
  const staticConfig       = pkg.config['staticHtml'];
  const distDir            = path.resolve(path.join(projectDir, 'dist'));
  const staticPath         = path.resolve(path.join(projectDir, 'static'));
  const moduleSuffixes     = [
    'admin',
    'config',
    'structure',
    'interactive'
  ];

  if (fs.existsSync(projectDir)) {
    console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ' + projectName + ' directory already exists!\n'));
    process.exit(1);
  }

  try {
    clear();

    //////////////////////////////////
    // Cloning and Git
    //////////////////////////////////

    console.log('\n' + chalk.blue('[artax] ') + chalk.dim('[1/6]') + ' \uD83C\uDFD7  Creating ' + projectName + ' project...\n');

    // clone boilerplate
    execSync(`git clone --branch ${vcsBranch} --depth 1 ${vcsRepo} ${projectName}`, {stdio: [0, 1, 2]});

    // remove .git folder
    fs.removeSync(path.join(projectDir, '.git'));

    // clone falcore
    execSync(`cd ${projectDir} && git clone --depth 1 ${staticConfig.repo} static`, {stdio: [0, 1, 2]});

    // remove .git directory, .artaxrc and bitbucket-pipelines.yml froms static
    fs.removeSync(path.join(staticPath, '.git'));
    fs.removeSync(path.join(staticPath, '.artaxrc'));
    fs.removeSync(path.join(staticPath, 'bitbucket-pipelines.yml'));

    // git init
    execSync(`cd ${projectDir} && git init -b main`, {stdio: [0, 1, 2]});

    // create .artaxrc file
    fs.outputJsonSync(path.join(projectDir, '.artaxrc'), {
      projectType: projectType,
      projectName: projectName
    }, {
      spaces: 2
    });

    //////////////////////////////////
    // Renaming Theme and Custom Modules
    //////////////////////////////////

    console.log('\n' + chalk.blue('[artax] ') + chalk.dim('[2/6]') + ' \u270F\uFE0F  Renaming theme and custom modules...\n');

    // Modify composer.json
    const composerJson = fs.readJsonSync(path.join(projectDir, 'composer.json'));
    composerJson.name = 'interactivestrategies/' + projectName;
    composerJson.description = projectDescription;
    fs.writeJsonSync(path.join(projectDir, 'composer.json'), composerJson, { spaces: 2 });

    // find and replace 'is_starter' with 'project_name' within files
    replaceInFile.sync({
      files: [
        path.join(projectDir, '.gitignore'),
        path.join(projectDir, 'bitbucket-pipelines.yml'),
        path.join(projectDir, '*.md'),
        path.join(distDir, 'modules/custom/**/*'),
        path.join(distDir, 'profiles/custom/**/*'),
        path.join(distDir, 'themes/custom/**/*')
      ],
      from: /is_starter/g,
      to: snakeCase(projectName)
    });

    // find and replace module names (e.g. 'custom_structure') with 'project_name_*' within files
    const snakeCaseProjectName = snakeCase(projectName),
          moduleNameRegexes = [],
          moduleNameReplacements = [];
    for (const suffix of moduleSuffixes) {
      moduleNameRegexes.push(new RegExp('custom_' + suffix, 'g'));
      moduleNameReplacements.push(snakeCaseProjectName + '_' + suffix);
    }
    replaceInFile.sync({
      files: path.join(distDir, 'modules/custom/**/*'),
      from: moduleNameRegexes,
      to: moduleNameReplacements
    });

    replaceInFile.sync({
      files: path.join(distDir, 'profiles/custom/**/*'),
      from: moduleNameRegexes,
      to: moduleNameReplacements
    });

    replaceInFile.sync({
      files: path.join(distDir, 'profiles/custom/**/*'),
      from: 'is_starter',
      to: snakeCase(projectName)
    });

    // find and replace 'CustomConfig' with 'ProjectNameConfig' within files
    replaceInFile.sync({
      files: path.join(distDir, 'modules/custom/**/*'),
      from: /CustomConfig/g,
      to: pascalCase(projectName) + 'Config'
    });

    // find and replace content context manager string within files
    replaceInFile.sync({
      files: path.join(distDir, 'modules/custom/**/*'),
      from: /custom.content_context_manager/g,
      to: snakeCase(projectName) + '.content_context_manager'
    });

    // find and replace module name/package name within files
    replaceInFile.sync({
      files: path.join(distDir, 'modules/custom/**/*.info.yml'),
      from: [
        /[cC]lient/g,
        /Custom/g
      ],
      to: capitalCase(projectName)
    });

    // find and replace permission strings within config module.
    replaceInFile.sync({
      files: path.join(distDir, 'modules/custom/custom_config/**/*'),
      from: [
        /edit client site configuration/g,
        /Edit client site configuration/g,
      ],
      to: [
        'edit ' + noCase(projectName) + ' site configuration',
        'Edit ' + capitalCase(projectName) + ' site configuration',
      ]
    });

    // find and replace site config form use of "custom".
    replaceInFile.sync({
      files: [
        path.join(distDir, 'modules/custom/custom_config/custom_config.links.menu.yml'),
        path.join(distDir, 'modules/custom/custom_config/custom_config.routing.yml'),
      ],
      from: [
        /Custom/g,
        /custom/g,
      ],
      to: [
        capitalCase(projectName),
        paramCase(projectName)
      ]
    });

    (async () => {

      // find and replace 'is_starter' with 'project_name' in filenames
      await RenameFiles.rename({
        files: path.join(distDir, 'themes/custom/**/*'),
        find: 'is_starter',
        replace: snakeCase(projectName)
      });

      // find and replace 'CustomConfig' with 'ProjectNameConfig' in filenames
      await RenameFiles.rename({
        files: path.join(distDir, 'modules/custom/custom_config/src/*'),
        find: 'CustomConfig',
        replace: pascalCase(projectName) + 'Config'
      });

      // find and replace 'custom_*' with 'project_name_*' in filenames
      for (const suffix of moduleSuffixes) {
        await RenameFiles.rename({
          files: path.join(distDir, 'modules/custom/**/*'),
          find: 'custom_' + suffix,
          replace: snakeCase(projectName) + '_' + suffix
        });

        await RenameFiles.rename({
          files: path.join(distDir, 'profiles/custom/**/*'),
          find: 'custom_' + suffix,
          replace: snakeCase(projectName) + '_' + suffix
        });

        await RenameFiles.rename({
          files: path.join(distDir, 'profiles/custom/**/*'),
          find: 'is_starter',
          replace: snakeCase(projectName)
        });
      }

    })()
      .then(() => {

        console.log('\nFinished renaming theme and custom modules...\n');

        //////////////////////////////////
        // Composer
        //////////////////////////////////

        console.log('\n' + chalk.blue('[artax] ') + chalk.dim('[3/6]') + ' \uD83D\uDCE6  Installing composer dependencies...\n');

        // composer install
        execSync(`cd ${projectDir} && composer install`, {stdio: [0, 1, 2]});

        //////////////////////////////////
        // Static
        //////////////////////////////////

        console.log('\n' + chalk.blue('[artax] ') + chalk.dim('[4/6]') + ' \uD83C\uDFA8  Creating static FED...\n');

        // modify package.json
        const packageJson = fs.readJsonSync(path.join(staticPath, 'package.json'));
        packageJson.name = projectName;
        packageJson.description = projectDescription;
        fs.writeJsonSync(path.join(staticPath, 'package.json'), packageJson, { spaces: 2 });

        // modify .eslintrc
        const eslintrcPath = path.join(staticPath, '.eslintrc.yml');
        let eslintrcContent = fs.readFileSync(eslintrcPath, { encoding: 'utf8' });
        eslintrcContent = eslintrcContent
          .replace('  # TODO: enable these Drupal globals, or remove them for non-Drupal projects\n', '')
          .replace('# Drupal: readonly', 'Drupal: readonly')
          .replace('# drupalSettings: readonly', 'drupalSettings: readonly')
          .replace('# once: readonly', 'once: readonly')
        ;
        fs.writeFileSync(eslintrcPath, eslintrcContent);

        // modify env.example
        const envExamplePath = path.join(staticPath, '.env.example');
        let envExampleContent = fs.readFileSync(envExamplePath, { encoding: 'utf8' });
        envExampleContent = envExampleContent
          .replace(/(#+\n# Drupal.*\n#*\s*)# (DRUPAL_PROJECT=.*\n)# (BACKEND_WEBROOT=".*"\n)# (BACKEND_ASSETS_PATH=".*)DRUPAL_THEME(.*")/i, '$1$2$3$4' + snakeCase(projectName) + '$5')
          .replace(/\n#+\n# Sitecore.*\n#*\s*# BACKEND_WEBROOT=".*\\.*"\n# BACKEND_ASSETS_PATH=".*\\.*"/i, '')
        ;
        fs.writeFileSync(envExamplePath, envExampleContent);

        // modify Twig templates to enable Drupal JS inclusion
        for (const twigTemplatePath of ['gulpfile.babel.js/builders/styleguide-builder/index.twig', 'src/layout.twig']) {
          const layoutTwigPath = path.join(staticPath, twigTemplatePath);
          let layoutTwigContent = fs.readFileSync(layoutTwigPath, { encoding: 'utf8' });
          layoutTwigContent = layoutTwigContent.replace(/{# Drupal only JS[^#]* #}\s*{# (<script[^#]*<\/script>) #}/gi, '{# Drupal JS #}\n  $1');
          fs.writeFileSync(layoutTwigPath, layoutTwigContent);
        }

        // modify main.js for Drupal Behaviors
        const mainJsPath = path.join(staticPath, 'src/main.js');
        let mainJsContent = fs.readFileSync(mainJsPath, { encoding: 'utf8' });
        mainJsContent = mainJsContent
          .replace(/ *\/\/ TODO: on Drupal Projects.*\n(\s*\/\/ Initialize Drupal behaviors.*)\n(\s*)\/\/ (.+)/gi, '$1\n$2$3')
          .replace(/\/\/ (behaviors: \[\s*)\/\/ (\],)/gi, '$1$2')
        ;
        fs.writeFileSync(mainJsPath, mainJsContent);

        // create .env file
        fs.copySync(path.join(staticPath, '.env.example'), path.join(staticPath, '.env'));

        // Swap the license on Falcore to GPL, since we will copy JS files from Drupal core
        fs.copySync(path.join(distDir, 'core/LICENSE.txt'), path.join(staticPath, 'LICENSE.txt'));
        fs.unlinkSync(path.join(staticPath, 'LICENSE.md'));
        const readmePath = path.join(staticPath, 'README.md');
        let readmeContent = fs.readFileSync(readmePath, { encoding: 'utf8' });
        readmeContent = readmeContent.replace(/(#+ License\s*).*project.*licensed.*MIT License.*/i, '$1This project is licensed under the GNU General Public License - see the `license.txt` file for details');
        fs.writeFileSync(readmePath, readmeContent);

        // install dependencies with yarn
        console.log('\n' + chalk.blue('[artax] ') + chalk.dim('[5/6]') + ' \uD83D\uDCE6  Installing dependencies...\n');
        execSync(`cd ${staticPath} && yarn install`, {stdio: [0, 1, 2]});

        // copy Drupal JS dependencies from Drupal
        execSync(`cd ${staticPath} && yarn drupal-sync`, {stdio: [0, 1, 2]});

        //////////////////////////////////
        // Initial Git Commit
        //////////////////////////////////

        console.log('\n' + chalk.blue('[artax] ') + chalk.dim('[6/6]') + ' \uD83D\uDCE6  Creating initial git commit and branches...\n');

        execSync(`cd ${projectDir} && git add . && git commit -m "initial commit" && git checkout -b staging && git checkout -b development`, {stdio: [0, 1, 2]});

        //////////////////////////////////
        // Success
        //////////////////////////////////

        console.log('\n' + chalk.blue('[artax] ') + '\uD83D\uDCAF  ' + chalk.bold.green('Success!\n'));
        console.log(chalk.blue('[artax] ') + '\uD83E\uDD18  Done in ' + process.uptime() + 's.\n');
      })
      .catch((e) =>
        console.log(e)
      )
    ;

  } catch (err) {
    console.error(err);
  }

};
