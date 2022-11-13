import fs        from 'fs-extra';
import path      from 'path';
import chalk     from 'chalk';
import titleCase from '../../../../utils/title-case.js';

export default (genNameDirty, createJS) => {

  const genName = genNameDirty.toLowerCase();
  const properTitle = titleCase(genName).replace('-', ' ');

  // path where components live
  const genPath = path.resolve(process.cwd() + '/src/global-scss/helpers/mixins/_' + genName + '.scss');

  // set content for living stylguide comment for the top of scss partial
  const content = `// ${properTitle}
//
// Mixin description
//
// $param  = null - Parameter description
//
// Definition:
// @mixin ${genName}($param: null) {
//
// }
//
// Usage:
// .sample {
//   @include ${genName};
// }
//
// Compiled:
// .sample {
//
// }
//
// Styleguide Sass Mixins.${properTitle}
@mixin ${genName}($param: null) {

}
`;

  if (fs.existsSync(genPath)) {
    console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(genName) + ' mixin already exists!\n');
    process.exit(1);
  }

  console.log('\nGenerating mixin...\n');

  // Create twig file
  fs.writeFileSync(genPath, content);
  console.log('  \uD83D\uDC4D  ' + chalk.bold.green('Success! ') + chalk.cyan(genName) + ' mixin successfully created\n');

};
