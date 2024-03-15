const fs = require("fs");
const { Project, StructureKind, SourceFile } = require("ts-morph");

function generateMainTs() {
  // initialize
  const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
  });
  const sourceFiles = project.getSourceFiles();
  const behaviourClassDeclarations = sourceFiles.map(extractBehaviours).flat();

  const output = project.createSourceFile("./src/main-1.ts");

  behaviourClassDeclarations.forEach((behavoiur) => {
    output.addStatements(`registerBehaviourClass(${behavoiur.getName()})`);
  });
  output.addStatements(`const engine = new GameEngine()`);
  output.addStatements(`engine.start()`);
  output.fixMissingImports();
  const content = output.print();
  fs.writeFileSync("./src/main.ts", content, "utf-8");
}

/**
 *
 * @param {import('ts-morph').SourceFile} sourceFile
 */
function extractBehaviours(sourceFile) {
  return sourceFile.getClasses().filter(isBehaviour);
}

/**
 *
 * @param {import('ts-morph').ClassDeclaration} classDeclaration
 */
function isBehaviour(classDeclaration) {
  const className = classDeclaration.getName();
  const baseClass = classDeclaration.getBaseClass();
  if (!baseClass) {
    return false;
  }
  const baseClassName = baseClass.getName();
  if (baseClassName === "Behaviour") {
    return className !== "Binding";
  } else if (baseClassName === "Binding") {
    return true;
  } else {
    return false;
  }
}

module.exports.generateMainTs = generateMainTs;
