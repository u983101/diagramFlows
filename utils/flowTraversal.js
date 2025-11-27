const fs = require('fs');
const path = require('path');

// Load flow data from JSON file
const loadFlowData = () => {
  try {
    const dataPath = path.join(__dirname, '../public/output.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading flow data:', error);
    throw new Error('Failed to load flow data');
  }
};

// Get flows that are triggered by a specific table
const getFlowsByInputTable = (tableName, flows) => {
  return flows.filter(flow => 
    flow.trigger === 'database' && 
    flow.inputDatabase && 
    flow.inputDatabase.name === tableName
  );
};

// Get available starting tables (all databases)
const getAvailableStartingTables = (databases) => {
  return databases.map(db => db.name);
};

// Recursively build flow hierarchy
const buildFlowHierarchy = (startingTable, flows, currentLevel = 0, visitedTables = new Set(), visitedFlows = new Set(), parentFlow = null) => {
  // Prevent infinite loops
  if (visitedTables.has(startingTable)) {
    return { nodes: [], maxLevel: currentLevel, visitedTables, visitedFlows };
  }

  visitedTables.add(startingTable);

  const triggeredFlows = getFlowsByInputTable(startingTable, flows);
  const nodes = [];

  for (const flow of triggeredFlows) {
    // Skip if we've already visited this flow to prevent cycles
    if (visitedFlows.has(flow.name)) {
      continue;
    }

    visitedFlows.add(flow.name);

    // Create node for current flow
    const flowNode = {
      flow: flow,
      level: currentLevel,
      parentFlow: parentFlow
    };
    nodes.push(flowNode);

    // Recursively process output databases
    for (const outputDb of flow.outputDatabases) {
      const childHierarchy = buildFlowHierarchy(
        outputDb.name,
        flows,
        currentLevel + 1,
        new Set(visitedTables),
        new Set(visitedFlows),
        flow.name
      );
      
      nodes.push(...childHierarchy.nodes);
      visitedTables = new Set([...visitedTables, ...childHierarchy.visitedTables]);
      visitedFlows = new Set([...visitedFlows, ...childHierarchy.visitedFlows]);
    }
  }

  const maxLevel = nodes.length > 0 ? Math.max(...nodes.map(node => node.level)) : currentLevel;

  return {
    nodes,
    maxLevel,
    visitedTables,
    visitedFlows
  };
};

// FlowTraversalService class
class FlowTraversalService {
  constructor() {
    this.flowData = loadFlowData();
  }

  getHierarchy(startingTable) {
    if (!this.flowData.databases.some(db => db.name === startingTable)) {
      throw new Error(`Table '${startingTable}' not found in available databases`);
    }

    const result = buildFlowHierarchy(startingTable, this.flowData.flows);
    
    return {
      hierarchy: {
        startingTable,
        nodes: result.nodes,
        maxLevel: result.maxLevel
      },
      visitedTables: Array.from(result.visitedTables),
      visitedFlows: Array.from(result.visitedFlows)
    };
  }

  getNextLevel(hierarchy, targetLevel) {
    return hierarchy.nodes.filter(node => node.level === targetLevel);
  }

  getAvailableTables() {
    return getAvailableStartingTables(this.flowData.databases);
  }

  getAllFlows() {
    return this.flowData.flows;
  }
}

module.exports = {
  FlowTraversalService,
  buildFlowHierarchy,
  getFlowsByInputTable,
  getAvailableStartingTables,
  loadFlowData
};