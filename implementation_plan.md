# Implementation Plan

Create a JavaScript Express application for visualizing database flow hierarchies with toggleable views and server-side traversal logic.

This implementation will build a web application that allows users to select a starting database table and visualize the flow hierarchy triggered by changes to that table. The application will support deep flow traversal with server-side processing, toggleable visualization modes, and a clean, functional interface design.

## Types  
Define TypeScript interfaces for the data structure and flow traversal logic.

```typescript
interface Database {
  name: string;
}

interface DatabaseAction {
  name: string;
  action: 'create' | 'update' | 'delete';
  fields?: string[];
}

interface Flow {
  name: string;
  trigger: 'manual' | 'database';
  inputDatabase?: {
    name: string;
    trigger: number;
    fields: string[];
  };
  outputDatabases: DatabaseAction[];
}

interface FlowData {
  databases: Database[];
  flows: Flow[];
}

interface FlowNode {
  flow: Flow;
  level: number;
  parentFlow?: string;
}

interface FlowHierarchy {
  startingTable: string;
  nodes: FlowNode[];
  maxLevel: number;
}

interface FlowTraversalResult {
  hierarchy: FlowHierarchy;
  visitedTables: Set<string>;
  visitedFlows: Set<string>;
}
```

## Files
Create new files and modify existing structure for the Express application.

**New Files:**
- `package.json` - Project dependencies and scripts
- `server.js` - Express server with API endpoints
- `public/index.html` - Main application interface
- `public/app.js` - Client-side JavaScript for UI interactions
- `public/styles.css` - Clean styling for the application
- `utils/flowTraversal.js` - Server-side flow traversal logic
- `routes/flows.js` - API route handlers for flow data

**Existing Files:**
- `public/output.json` - Keep as data source (no changes needed)

**Configuration:**
- Update package.json with Express, CORS, and development dependencies
- Configure server to serve static files from public directory
- Set up API routes for flow data retrieval

## Functions
Implement server-side flow traversal and client-side UI management.

**New Functions:**
- `buildFlowHierarchy(startingTable, flows, currentLevel = 0, visitedTables = new Set(), visitedFlows = new Set(), parentFlow = null)` - Recursively builds flow hierarchy from starting table
- `getFlowsByInputTable(tableName, flows)` - Returns flows triggered by specific table
- `getAvailableStartingTables(databases)` - Returns list of tables for initial selection
- `initializeServer()` - Sets up Express server with routes and middleware
- `handleTableSelection(tableName)` - Client-side handler for table selection
- `toggleViewMode()` - Switches between tree and step-by-step visualization
- `loadNextLevel(level)` - Fetches and displays next layer of flows

**Modified Functions:**
- None (new project)

**Removed Functions:**
- None (new project)

## Classes
Implement utility classes for flow management and visualization.

**New Classes:**
- `FlowTraversalService` - Handles server-side flow hierarchy building
  - `constructor(flowData)`
  - `getHierarchy(startingTable)`
  - `getNextLevel(hierarchy, targetLevel)`
- `FlowVisualizer` - Client-side visualization management
  - `constructor(containerElement)`
  - `renderTreeView(hierarchy)`
  - `renderStepView(hierarchy)`
  - `toggleView()`

**Modified Classes:**
- None (new project)

**Removed Classes:**
- None (new project)

## Dependencies
Install and configure required npm packages.

**Production Dependencies:**
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `path` - Node.js path utilities (built-in)

**Development Dependencies:**
- `nodemon` - Auto-restart server during development

**Integration Requirements:**
- Express server configured to serve static files
- CORS enabled for local development
- JSON parsing middleware for API requests

## Testing
Implement basic testing strategy for flow traversal logic.

**Test Files:**
- `tests/flowTraversal.test.js` - Unit tests for flow hierarchy building
- `tests/integration.test.js` - API endpoint integration tests

**Test Scenarios:**
- Single-level flow traversal
- Multi-level flow hierarchy
- Circular reference detection
- Empty starting table validation
- Invalid table name handling

**Validation Strategies:**
- Verify hierarchy depth matches expected levels
- Confirm all flows are properly connected
- Ensure no infinite loops in traversal
- Validate API response structure

## Implementation Order
Execute implementation steps in logical sequence to minimize conflicts.

1. **Setup Project Structure** - Initialize package.json and install dependencies
2. **Create Server Foundation** - Set up Express server with basic routing
3. **Implement Flow Traversal Logic** - Build server-side hierarchy algorithm
4. **Create API Endpoints** - Implement routes for flow data retrieval
5. **Build Client Interface** - Create HTML, CSS, and JavaScript for UI
6. **Implement Visualization** - Add toggleable tree and step-by-step views
7. **Add Loading States** - Implement progress indicators and error handling
8. **Testing and Validation** - Verify functionality and fix edge cases
9. **Documentation and Polish** - Add comments and finalize styling
