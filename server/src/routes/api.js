const express = require('express');
const router = express.Router();

// Import controllers
const testingController = require('../controllers/testingController');
const docsController = require('../controllers/docsController');
const migrationController = require('../controllers/migrationController');
const dependencyController = require('../controllers/dependencyController');

// Testing routes
router.post('/testing/run', testingController.runTests);
router.get('/testing/results', testingController.getTestResults);
router.post('/testing/coverage', testingController.generateCoverageReport);

// Documentation routes
router.post('/docs/generate', docsController.generateDocs);
router.get('/docs/preview', docsController.previewDocs);
router.get('/docs/download', docsController.downloadDocs);
router.get('/docs/search', docsController.searchDocs);

// Migration routes
router.get('/migration/analyze', migrationController.analyzeProject);
router.post('/migration/migrate', migrationController.migrateProject);
router.post('/migration/backup', migrationController.backupProject);
router.post('/migration/kotlin', migrationController.convertToKotlin);
router.post('/migration/dependencies', migrationController.updateDependencies);

// Dependency routes
router.get('/dependencies', dependencyController.listDependencies);
router.post('/dependencies/add', dependencyController.addDependency);
router.delete('/dependencies/:id', dependencyController.removeDependency);
router.get('/dependencies/search', dependencyController.searchMavenCentral);
router.put('/dependencies/:id', dependencyController.updateDependency);
router.get('/dependencies/updates', dependencyController.checkForUpdates);

module.exports = router;