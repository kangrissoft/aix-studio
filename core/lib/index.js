// Core Library Index - Export all core utilities and builders

const JavaBuilder = require('./builders/javaBuilder');
const KotlinBuilder = require('./builders/kotlinBuilder');
const TestBuilder = require('./builders/testBuilder');
const DocBuilder = require('./builders/docBuilder');

const ProjectGenerator = require('./generators/projectGenerator');
const MethodGenerator = require('./generators/methodGenerator');
const PropertyGenerator = require('./generators/propertyGenerator');
const TemplateGenerator = require('./generators/templateGenerator');

const ProjectValidator = require('./validators/projectValidator');
const BuildValidator = require('./validators/buildValidator');
const DependencyValidator = require('./validators/dependencyValidator');

const LibraryDownloader = require('./downloaders/libraryDownloader');
const TemplateDownloader = require('./downloaders/templateDownloader');
const MavenDownloader = require('./downloaders/mavenDownloader');

const FileUtils = require('./utils/fileUtils');
const StringUtils = require('./utils/stringUtils');
const ConfigUtils = require('./utils/configUtils');
const Logger = require('./utils/logger');

const StructureMigrator = require('./migrators/structureMigrator');
const BuildMigrator = require('./migrators/buildMigrator');
const KotlinMigrator = require('./migrators/kotlinMigrator');

const UnitTester = require('./testers/unitTester');
const CoverageAnalyzer = require('./testers/coverageAnalyzer');

// Export all modules
module.exports = {
  // Builders
  JavaBuilder,
  KotlinBuilder,
  TestBuilder,
  DocBuilder,
  
  // Generators
  ProjectGenerator,
  MethodGenerator,
  PropertyGenerator,
  TemplateGenerator,
  
  // Validators
  ProjectValidator,
  BuildValidator,
  DependencyValidator,
  
  // Downloaders
  LibraryDownloader,
  TemplateDownloader,
  MavenDownloader,
  
  // Utilities
  FileUtils,
  StringUtils,
  ConfigUtils,
  Logger,
  
  // Migrators
  StructureMigrator,
  BuildMigrator,
  KotlinMigrator,
  
  // Testers
  UnitTester,
  CoverageAnalyzer
};