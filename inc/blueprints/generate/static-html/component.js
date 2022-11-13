import fs            from 'fs-extra';
import path          from 'path';
import chalk         from 'chalk';
import { snakeCase } from 'change-case';
import titleCase     from '../../../../utils/title-case.js';

export default (genNameDirty, createJS) => {

  const genName = genNameDirty.toLowerCase();

  // get filename without extension
  const filename = path.basename(genName, path.extname(genName));
  const properTitle = titleCase(filename).replace('-', ' ');
  const snakeFileName = snakeCase(filename);

  // path where components live
  const createPath = path.resolve(process.cwd() + '/src/components/' + genName + '/' + filename);

  // set content for living stylguide comment for the top of scss partials
  const scssContent = `// ${properTitle}
//
// .-modifier - Modifier description
//
// Markup: ${filename}.twig
//
// Styleguide Components.${properTitle}
.${filename} {

}
`;

  // set content for js partials
  const jsContent = `export default () => {
  // function contents go here
};
`;

  // set content for twig partials
  const twigContent = `{% set data = ${snakeFileName} %}

<!-- components/${genName}/${filename}.twig -->
<article class="${filename}">

</article>
`;

  // set content for json partials
  const jsonContent = `{
  "${snakeFileName}": {

  }
}`;

  // Make sure component doesn't already exist
  if (fs.existsSync(path.resolve(process.cwd() + '/src/components/' + genName))) {
    console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(genName) + ' component already exists!\n');
    process.exit(1);
  }

  console.log('\nGenerating component...\n');

  // helper function for creating file and logging to console
  function createFile(num, extension, content) {
    fs.outputFileSync(createPath + extension, content);
    console.log(logPrefix(num) + chalk.cyan(genName + extension) + ' successfully created');
  }

  const total = createJS ? 4 : 3;

  // Create twig partial
  createFile(1, '.twig', twigContent);

  // Create sass partial
  createFile(2, '.scss', scssContent);

  // Create json partial
  createFile(3, '.json', jsonContent);

  // Create javascript partial if --js flag is present
  if (createJS) {
    createFile(4, '.js', jsContent);
  }

  console.log();

  // console log prefix
  function logPrefix(num) {
    return '  ' + chalk.dim('[' + num + `/${total}]`) + ' \uD83D\uDC4D  ' + chalk.bold.green('Success! ');
  }

};
