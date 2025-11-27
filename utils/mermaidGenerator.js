const { FlowTraversalService } = require('./flowTraversal');

class MermaidGenerator {
  constructor() {
    this.flowService = new FlowTraversalService();
    this.flowData = this.flowService.flowData;
  }

  /**
   * Generate Mermaid.js flowchart code from flow hierarchy
   * @param {string} startingTable - The starting database table
   * @returns {Object} Object containing mermaidCode and metadata
   */
  generateFlowchart(startingTable) {
    try {
      const result = this.flowService.getHierarchy(startingTable);
      const hierarchy = result.hierarchy; // Extract the actual hierarchy object
      const mermaidCode = this.buildMermaidSyntax(hierarchy);
      
      return {
        mermaidCode: mermaidCode,
        nodeCount: hierarchy.nodes.length + 1, // +1 for starting table
        edgeCount: this.countEdges(hierarchy),
        config: {
          theme: 'default',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate Mermaid flowchart: ${error.message}`);
    }
  }

  /**
   * Build Mermaid.js syntax from flow hierarchy
   * @param {Object} hierarchy - Flow hierarchy object
   * @returns {string} Mermaid.js flowchart syntax
   */
  buildMermaidSyntax(hierarchy) {
    const lines = ['flowchart TD'];
    
    // Add starting table as a database node
    const startingTableId = this.sanitizeId(hierarchy.startingTable);
    lines.push(`    ${startingTableId}[(${hierarchy.startingTable})]`);
    
    // Process each flow node
    hierarchy.nodes.forEach(node => {
      const flow = node.flow;
      const flowId = this.sanitizeId(flow.name);
      
      // Add flow node with appropriate shape based on trigger type
      if (flow.trigger === 'manual') {
        lines.push(`    ${flowId}([${flow.name}])`);
      } else {
        lines.push(`    ${flowId}[[${flow.name}]]`);
      }
      
      // Add edges from input to flow
      if (flow.inputDatabase) {
        const inputId = this.sanitizeId(flow.inputDatabase.name);
        lines.push(`    ${inputId} --> ${flowId}`);
      } else if (node.parentFlow) {
        // For flows without explicit input database, connect from parent flow
        const parentId = this.sanitizeId(node.parentFlow);
        lines.push(`    ${parentId} --> ${flowId}`);
      }
      
      // Add edges from flow to output databases
      flow.outputDatabases.forEach(output => {
        const outputId = this.sanitizeId(output.name);
        // Ensure output database node exists
        if (!lines.some(line => line.includes(`${outputId}[(`))) {
          lines.push(`    ${outputId}[(${output.name})]`);
        }
        lines.push(`    ${flowId} --> ${outputId}`);
      });
    });

    // Add styling classes to differentiate node types
    lines.push('');
    lines.push('    classDef database fill:#e1f5fe,stroke:#01579b,stroke-width:2px');
    lines.push('    classDef flow fill:#f3e5f5,stroke:#4a148c,stroke-width:2px');
    lines.push('    classDef manual fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px');
    lines.push('');

    // Apply classes to nodes
    hierarchy.nodes.forEach(node => {
      const flowId = this.sanitizeId(node.flow.name);
      if (node.flow.trigger === 'manual') {
        lines.push(`    class ${flowId} manual`);
      } else {
        lines.push(`    class ${flowId} flow`);
      }
    });

    // Apply database class to all database nodes
    const allDatabases = this.getAllDatabaseNodes(hierarchy);
    allDatabases.forEach(db => {
      const dbId = this.sanitizeId(db);
      lines.push(`    class ${dbId} database`);
    });

    return lines.join('\n');
  }

  /**
   * Sanitize ID for Mermaid.js (remove special characters, spaces, etc.)
   * @param {string} id - Original ID
   * @returns {string} Sanitized ID
   */
  sanitizeId(id) {
    return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
  }

  /**
   * Count total edges in the hierarchy
   * @param {Object} hierarchy - Flow hierarchy
   * @returns {number} Total edge count
   */
  countEdges(hierarchy) {
    let count = 0;
    
    hierarchy.nodes.forEach(node => {
      const flow = node.flow;
      
      // Count input edges
      if (flow.inputDatabase || node.parentFlow) {
        count++;
      }
      
      // Count output edges
      count += flow.outputDatabases.length;
    });
    
    return count;
  }

  /**
   * Get all unique database nodes in the hierarchy
   * @param {Object} hierarchy - Flow hierarchy
   * @returns {Array} Array of database names
   */
  getAllDatabaseNodes(hierarchy) {
    const databases = new Set();
    
    // Add starting table
    databases.add(hierarchy.startingTable);
    
    // Add all input and output databases from flows
    hierarchy.nodes.forEach(node => {
      const flow = node.flow;
      
      if (flow.inputDatabase) {
        databases.add(flow.inputDatabase.name);
      }
      
      flow.outputDatabases.forEach(output => {
        databases.add(output.name);
      });
    });
    
    return Array.from(databases);
  }

  /**
   * Generate a simple test flowchart for validation
   * @returns {string} Test Mermaid.js code
   */
  generateTestFlowchart() {
    return `flowchart TD
    A[(${this.flowData.databases[0]?.name || 'test_db'})]
    B[[test_flow]]
    A --> B
    B --> C[(${this.flowData.databases[1]?.name || 'output_db'})]
    
    classDef database fill:#e1f5fe,stroke:#01579b
    classDef flow fill:#f3e5f5,stroke:#4a148c
    
    class A,C database
    class B flow`;
  }
}

module.exports = { MermaidGenerator };
