import { program }     from 'commander';
import inquirer        from 'inquirer';
import validatePkgName from 'validate-npm-package-name';
import chalk           from 'chalk';
import clear           from 'clear';
import fs              from 'fs-extra';
import path            from 'path';
import { execSync }    from 'child_process';
import replaceInFile   from 'replace-in-file';
import os              from 'os';
import { readFile }    from 'fs/promises';
import titleCase       from '../../../utils/title-case.js';

const pkg = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url)));

export default (response) => {

  const projectType        = response.projectType;
  const projectDir         = response.projectDir;
  const domainName         = response.domainName;
  const distDir            = path.join(projectDir, 'dist');
  const themesDir          = path.join(distDir, 'web/app/themes');
  const themeDir           = path.join(themesDir, 'emperor');
  const projectName        = response.projectName;
  const projectDescription = response.projectDescription;
  const vcsRepo            = response.vcsRepo;
  const vcsBranch          = response.vcsBranch;
  const operatingSystem    = os.platform();
  const numberSteps        = operatingSystem === 'darwin' || operatingSystem === 'linux' ? '4' : '3';

  if (fs.existsSync(projectDir)) {
    console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(projectDir) + ' directory already exists!\n');
    process.exit(1);
  }

  try {
    clear();

    //////////////////////////////////
    // Cloning and Git
    //////////////////////////////////

    console.log('\n' + chalk.blue('[artax] ') + chalk.dim(`[1/${numberSteps}]`) + ' \uD83C\uDFD7  Creating ' + projectName + ' project...\n');

    // clone boilerplate
    execSync(`git clone --branch ${vcsBranch} --depth 1 ${vcsRepo} ${projectName}`, {stdio: [0, 1, 2]});

    // remove .git directory
    fs.removeSync(path.join(projectDir, '.git'));

    // git init
    execSync(`cd ${projectDir} && git init -b main`, {stdio: [0, 1, 2]});

    // change theme name
    replaceInFile.sync({
      files: path.join(themeDir, 'style.css'),
      from: 'Emperor',
      to: titleCase(projectName).replace('-', ' ')
    });

    // change domain name
    replaceInFile.sync({
      files: [
        path.join(projectDir, '.env.example'),
        path.join(distDir, '.env.example'),
        path.join(themeDir, 'gulpfile.babel.js/tasks/watch.js'),
        path.join(projectDir, 'cli/artax/create-cert.sh'),
        path.join(projectDir, 'cli/artax/setup-hosts-file.sh'),
        path.join(projectDir, 'cli/artax/trust-cert.sh')
      ],
      from: /emperor.com/g,
      to: domainName
    });

    // change app and theme name
    replaceInFile.sync({
      files: [
        path.join(projectDir, '.platform.app.yaml'),
        path.join(projectDir, '.platform/routes.yaml'),
        path.join(projectDir, 'scripts/build.sh'),
        path.join(projectDir, '.env.example'),
        path.join(projectDir, 'bitbucket-pipelines.yml')
      ],
      from: /emperor/g,
      to: projectName
    });

    // create .artaxrc file
    fs.outputJsonSync(path.join(themeDir, '.artaxrc'), {
      projectType: projectType,
      projectName: projectName
    }, {
      spaces: 2
    });

    // create wp .env files
    fs.copySync(path.join(projectDir, '.env.example'), path.join(projectDir, '.env'));
    fs.copySync(path.join(distDir, '.env.example'), path.join(distDir, '.env'));

    //////////////////////////////////
    // Composer
    //////////////////////////////////

    console.log('\n' + chalk.blue('[artax] ') + chalk.dim(`[2/${numberSteps}]`) + ' \uD83D\uDCE6  Installing composer dependencies...\n');

    // composer install
    execSync(`cd ${distDir} && composer install`, {stdio: [0, 1, 2]});

    // modify composer.json
    const composerJson = fs.readJsonSync(path.join(distDir, 'composer.json'));
    composerJson.name = 'interactivestrategies/' + projectName;
    composerJson.description = projectDescription;
    fs.writeJsonSync(path.join(distDir, 'composer.json'), composerJson, { spaces: 2 });

    //////////////////////////////////
    // FED
    //////////////////////////////////

    // modify package.json
    const packageJson = fs.readJsonSync(path.join(themeDir, 'package.json'));
    packageJson.name = projectName;
    packageJson.description = projectDescription;
    fs.writeJsonSync(path.join(themeDir, 'package.json'), packageJson, { spaces: 2 });

    // install dependencies with yarn
    console.log('\n' + chalk.blue('[artax] ') + chalk.dim(`[3/${numberSteps}]`) + ' \uD83D\uDCE6  Installing node dependencies...\n');
    execSync(`cd ${themeDir} && yarn install`, {stdio: [0, 1, 2]});

    // rename theme directory
    fs.renameSync(themeDir, path.join(themesDir, projectName));

    let nextStep = 4;

    if (operatingSystem === 'darwin' || operatingSystem === 'linux') {

      // create SSL and setup hosts
      console.log('\n' + chalk.blue('[artax] ') + chalk.dim(`[${nextStep}/${numberSteps}] `) + '\ud83d\udd10  Creating and trusting SSL certs and adding domain to hosts file...\n');
      nextStep = 5;

      console.log('\n      ' + chalk.cyan.bold('Creating SSH cert and key...\n\n'));

      execSync(`cd ${projectDir} && bash ` + path.join('cli/artax/create-cert.sh'), {stdio: [0, 1, 2]});

      console.log('\n      ' + chalk.cyan.bold('Trusting SSH cert...\n\n'));

      execSync(`cd ${projectDir} && bash ` + path.join(projectDir, 'cli/artax/trust-cert.sh'), {stdio: [0, 1, 2]});

      console.log('\n      ' + chalk.cyan.bold('Adding domain name to hosts file...\n\n'));

      execSync(`cd ${projectDir} && bash ` + path.join(projectDir, 'cli/artax/setup-hosts-file.sh'), {stdio: [0, 1, 2]});

    }

    //////////////////////////////////
    // Initial Git Commit
    //////////////////////////////////

    console.log('\n' + chalk.blue('[artax] ') + chalk.dim(`[${nextStep}/${numberSteps}]`) + ' \uD83D\uDCE6  Creating initial git commit and branches...\n');

    execSync(`cd ${projectDir} && git add . && git commit -m "initial commit" && git checkout -b staging && git checkout -b development`, {stdio: [0, 1, 2]});

    //////////////////////////////////
    // Success
    //////////////////////////////////

    console.log('\n' + chalk.blue('[artax] ') + '\uD83D\uDCAF  ' + chalk.bold.green('Success! ') + projectName + ' project created in ' + chalk.bold.cyan(projectDir) + '!\n');
    console.log(chalk.blue('[artax] ') + '\uD83E\uDD18  Done in ' + process.uptime() + 's.\n');

  } catch (err) {
    console.error(err);
  }

};
