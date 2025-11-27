const express = require('express');
const { FlowTraversalService } = require('../utils/flowTraversal');
const { MermaidGenerator } = require('../utils/mermaidGenerator');

const router = express.Router();
const flowService = new FlowTraversalService();
const mermaidGenerator = new MermaidGenerator();

// Get all available starting tables
router.get('/tables', (req, res) => {
  try {
    const tables = flowService.getAvailableTables();
    res.json({
      success: true,
      data: tables.sort()
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available tables'
    });
  }
});

// Get flow hierarchy for a specific starting table
router.get('/hierarchy/:tableName', (req, res) => {
  try {
    const { tableName } = req.params;
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        error: 'Table name is required'
      });
    }

    const result = flowService.getHierarchy(tableName);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error building flow hierarchy:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to build flow hierarchy'
    });
  }
});

// Get flows at a specific level
router.get('/hierarchy/:tableName/level/:level', (req, res) => {
  try {
    const { tableName, level } = req.params;
    const levelNum = parseInt(level, 10);
    
    if (!tableName || isNaN(levelNum)) {
      return res.status(400).json({
        success: false,
        error: 'Table name and valid level number are required'
      });
    }

    const result = flowService.getHierarchy(tableName);
    const levelNodes = flowService.getNextLevel(result.hierarchy, levelNum);
    
    res.json({
      success: true,
      data: {
        level: levelNum,
        nodes: levelNodes,
        totalLevels: result.hierarchy.maxLevel
      }
    });
  } catch (error) {
    console.error('Error fetching level nodes:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch level nodes'
    });
  }
});

// Get all flows (for debugging or overview)
router.get('/', (req, res) => {
  try {
    const flows = flowService.getAllFlows();
    res.json({
      success: true,
      data: flows
    });
  } catch (error) {
    console.error('Error fetching flows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flows'
    });
  }
});

// Get flows triggered by a specific table
router.get('/table/:tableName/flows', (req, res) => {
  try {
    const { tableName } = req.params;
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        error: 'Table name is required'
      });
    }

    const flows = flowService.getFlowsByInputTable(tableName);
    
    res.json({
      success: true,
      data: flows
    });
  } catch (error) {
    console.error('Error fetching flows for table:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flows for table'
    });
  }
});

// Get output tables from specific flows
router.post('/flows/tables', (req, res) => {
  try {
    const { flowNames } = req.body;
    
    if (!flowNames || !Array.isArray(flowNames)) {
      return res.status(400).json({
        success: false,
        error: 'Flow names array is required'
      });
    }

    const tables = flowService.getOutputTablesFromFlows(flowNames);
    
    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Error fetching output tables:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch output tables'
    });
  }
});

// Generate Mermaid.js flowchart for a specific path
router.post('/mermaid/path', (req, res) => {
  try {
    const { path } = req.body;
    
    if (!path || !Array.isArray(path)) {
      return res.status(400).json({
        success: false,
        error: 'Path array is required'
      });
    }

    const result = mermaidGenerator.generatePathFlowchart(path);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating path Mermaid flowchart:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate path Mermaid flowchart'
    });
  }
});

// Generate Mermaid.js flowchart for a specific starting table
router.get('/mermaid/:tableName', (req, res) => {
  try {
    const { tableName } = req.params;
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        error: 'Table name is required'
      });
    }

    const result = mermaidGenerator.generateFlowchart(tableName);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating Mermaid flowchart:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate Mermaid flowchart'
    });
  }
});

module.exports = router;
