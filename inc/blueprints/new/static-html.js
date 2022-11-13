import { program }     from 'commander';
import inquirer        from 'inquirer';
import validatePkgName from 'validate-npm-package-name';
import chalk           from 'chalk';
import clear           from 'clear';
import fs              from 'fs-extra';
import path            from 'path';
import { execSync }    from 'child_process';
import replaceInFile   from 'replace-in-file';
import { readFile }    from 'fs/promises';

const pkg = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url)));

export default (response) => {

  const projectType        = response.projectType;
  const projectDir         = response.projectDir;
  const projectName        = response.projectName;
  const projectDescription = response.projectDescription;
  const vcsRepo            = response.vcsRepo;
  const vcsBranch          = response.vcsBranch;

  if (fs.existsSync(projectDir)) {
    console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(projectDir) + ' directory already exists!\n');
    process.exit(1);
  }

  try {
    clear();

    //////////////////////////////////
    // Cloning and Git
    //////////////////////////////////

    console.log('\n' + chalk.blue('[artax] ') + chalk.dim('[1/3]') + ' \uD83C\uDFD7  Creating ' + projectName + ' project...\n');

    // clone boilerplate
    execSync(`git clone --branch ${vcsBranch} --depth 1 ${vcsRepo} ${projectName}`, {stdio: [0, 1, 2]});

    // remove .git directory
    fs.removeSync(path.join(projectDir, '.git'));

    // git init
    execSync(`cd ${projectDir} && git init -b main`, {stdio: [0, 1, 2]});

    // create .artaxrc file
    fs.outputJsonSync(path.join(projectDir, '.artaxrc'), {
      projectType: projectType,
      projectName: projectName
    }, {
      spaces: 2
    });

    // modify package.json
    const packageJson = fs.readJsonSync(path.join(projectDir, 'package.json'));
    packageJson.name = projectName;
    packageJson.description = projectDescription;
    fs.writeJsonSync(path.join(projectDir, 'package.json'), packageJson, { spaces: 2 });

    // add s3 bucket name
    replaceInFile.sync({
      files: path.join(projectDir, 'bitbucket-pipelines.yml'),
      from: 'S3_BUCKET_NAME',
      to: projectName
    });

    // create .env file
    fs.copySync(path.join(projectDir, '.env.example'), path.join(projectDir, '.env'));

    //////////////////////////////////
    // Install dependencies
    //////////////////////////////////

    console.log('\n' + chalk.blue('[artax] ') + chalk.dim('[2/3]') + ' \uD83D\uDCE6  Installing dependencies...\n');
    execSync(`cd ${projectDir} && yarn install`, {stdio: [0, 1, 2]});

    //////////////////////////////////
    // Initial Git Commit
    //////////////////////////////////

    console.log('\n' + chalk.blue('[artax] ') + chalk.dim('[3/3]') + ' \uD83D\uDCE6  Creating initial git commit and branches...\n');
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
