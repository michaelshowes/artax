import fs        from 'fs-extra';
import path      from 'path';
import chalk     from 'chalk';
import titleCase from '../../../../utils/title-case.js';

export default (genNameDirty, createJS) => {

  const genName = genNameDirty.toLowerCase();
  const properTitle = titleCase(genName).replace('-', ' ');

  // path where components live
  const genPath = path.resolve(process.cwd() + '/static/src/global-scss/helpers/functions/_' + genName + '.scss');

  // set content for living stylguide comment for the top of scss partial
  const content = `// ${properTitle}
//
// Function description
//
// $param  = null - Parameter description
//
// Function:
// @function ${genName}($param: null) {
//   @return $param;
// }
//
// Usage:
// .sample {
//   color: ${genName}(red);
// }
//
// Compiled:
// .sample {
//   color: red;
// }
//
// Styleguide Sass Functions.${properTitle}
@function ${genName}($param: null) {
  @return $param;
}
`;

  if (fs.existsSync(genPath)) {
    console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(genName) + ' function already exists!\n');
    process.exit(1);
  }

  console.log('\nGenerating function...\n');

  // Create twig file
  fs.writeFileSync(genPath, content);
  console.log('  \uD83D\uDC4D  ' + chalk.bold.green('Success! ') + chalk.cyan(genName) + ' function successfully created\n');

};
