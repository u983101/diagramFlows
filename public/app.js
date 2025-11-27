// FlowVisualizer class for client-side visualization management
class FlowVisualizer {
    constructor(containerElement) {
        this.container = containerElement;
        this.currentHierarchy = null;
        this.currentView = 'tree';
        this.currentStepLevel = 0;
        this.currentMermaidData = null;
        this.mermaidInitialized = false;
    }

    // Render tree view of the flow hierarchy
    renderTreeView(hierarchy) {
        const treeView = document.getElementById('treeView');
        treeView.innerHTML = '';

        if (!hierarchy || !hierarchy.nodes || hierarchy.nodes.length === 0) {
            treeView.innerHTML = '<div class="empty-message"><p>No flows found for this starting table.</p></div>';
            return;
        }

        const flowTree = document.createElement('div');
        flowTree.className = 'flow-tree';

        // Group nodes by level
        const nodesByLevel = {};
        hierarchy.nodes.forEach(node => {
            if (!nodesByLevel[node.level]) {
                nodesByLevel[node.level] = [];
            }
            nodesByLevel[node.level].push(node);
        });

        // Create level containers
        Object.keys(nodesByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
            const levelContainer = document.createElement('div');
            levelContainer.className = 'tree-level';

            const levelHeader = document.createElement('div');
            levelHeader.className = 'level-header';
            levelHeader.textContent = `Level ${level}`;
            levelContainer.appendChild(levelHeader);

            const flowNodesContainer = document.createElement('div');
            flowNodesContainer.className = 'flow-nodes';

            nodesByLevel[level].forEach(node => {
                const flowNode = this.createFlowNode(node);
                flowNodesContainer.appendChild(flowNode);
            });

            levelContainer.appendChild(flowNodesContainer);
            flowTree.appendChild(levelContainer);
        });

        treeView.appendChild(flowTree);
    }

    // Create individual flow node element
    createFlowNode(node) {
        const flowNode = document.createElement('div');
        flowNode.className = 'flow-node';

        const flowName = document.createElement('div');
        flowName.className = 'flow-name';
        flowName.textContent = node.flow.name;
        flowNode.appendChild(flowName);

        const triggerBadge = document.createElement('span');
        triggerBadge.className = `flow-trigger ${node.flow.trigger}`;
        triggerBadge.textContent = node.flow.trigger;
        flowNode.appendChild(triggerBadge);

        // Input database section
        if (node.flow.inputDatabase) {
            const inputSection = document.createElement('div');
            inputSection.className = 'flow-input';

            const inputHeader = document.createElement('h4');
            inputHeader.textContent = 'Input Database';
            inputSection.appendChild(inputHeader);

            const inputDb = document.createElement('div');
            inputDb.className = 'database-action';
            inputDb.innerHTML = `
                <span>${node.flow.inputDatabase.name}</span>
                <span class="action-badge">trigger</span>
            `;
            inputSection.appendChild(inputDb);

            if (node.flow.inputDatabase.fields && node.flow.inputDatabase.fields.length > 0) {
                const fieldsList = document.createElement('div');
                fieldsList.className = 'fields-list';
                fieldsList.textContent = `Fields: ${node.flow.inputDatabase.fields.join(', ')}`;
                inputSection.appendChild(fieldsList);
            }

            flowNode.appendChild(inputSection);
        }

        // Output databases section
        if (node.flow.outputDatabases && node.flow.outputDatabases.length > 0) {
            const outputSection = document.createElement('div');
            outputSection.className = 'flow-output';

            const outputHeader = document.createElement('h4');
            outputHeader.textContent = 'Output Databases';
            outputSection.appendChild(outputHeader);

            node.flow.outputDatabases.forEach(outputDb => {
                const dbAction = document.createElement('div');
                dbAction.className = 'database-action';
                dbAction.innerHTML = `
                    <span>${outputDb.name}</span>
                    <span class="action-badge ${outputDb.action}">${outputDb.action}</span>
                `;
                outputSection.appendChild(dbAction);

                if (outputDb.fields && outputDb.fields.length > 0) {
                    const fieldsList = document.createElement('div');
                    fieldsList.className = 'fields-list';
                    fieldsList.textContent = `Fields: ${outputDb.fields.join(', ')}`;
                    outputSection.appendChild(fieldsList);
                }
            });

            flowNode.appendChild(outputSection);
        }

        return flowNode;
    }

    // Render step-by-step view
    renderStepView(hierarchy) {
        const stepView = document.getElementById('stepView');
        const stepContent = document.getElementById('stepContent');
        stepContent.innerHTML = '';

        if (!hierarchy || !hierarchy.nodes || hierarchy.nodes.length === 0) {
            stepContent.innerHTML = '<div class="empty-message"><p>No flows found for this starting table.</p></div>';
            return;
        }

        // Get nodes for current level
        const levelNodes = hierarchy.nodes.filter(node => node.level === this.currentStepLevel);

        if (levelNodes.length === 0) {
            stepContent.innerHTML = '<div class="empty-message"><p>No flows at this level.</p></div>';
            return;
        }

        const stepLevel = document.createElement('div');
        stepLevel.className = 'step-level';

        const stepHeader = document.createElement('div');
        stepHeader.className = 'step-level-header';
        stepHeader.textContent = `Level ${this.currentStepLevel}`;
        stepLevel.appendChild(stepHeader);

        const flowNodesContainer = document.createElement('div');
        flowNodesContainer.className = 'flow-nodes';

        levelNodes.forEach(node => {
            const flowNode = this.createFlowNode(node);
            flowNodesContainer.appendChild(flowNode);
        });

        stepLevel.appendChild(flowNodesContainer);
        stepContent.appendChild(stepLevel);
    }

    // Toggle between tree, step, and mermaid views
    toggleView(viewType) {
        this.currentView = viewType;

        // Update active button states
        document.getElementById('treeViewBtn').classList.toggle('active', viewType === 'tree');
        document.getElementById('stepViewBtn').classList.toggle('active', viewType === 'step');
        document.getElementById('mermaidViewBtn').classList.toggle('active', viewType === 'mermaid');

        // Show/hide views
        document.getElementById('treeView').classList.toggle('active', viewType === 'tree');
        document.getElementById('stepView').classList.toggle('active', viewType === 'step');
        document.getElementById('mermaidView').classList.toggle('active', viewType === 'mermaid');

        // Re-render current view
        if (viewType === 'tree') {
            this.renderTreeView(this.currentHierarchy);
        } else if (viewType === 'step') {
            this.renderStepView(this.currentHierarchy);
        } else if (viewType === 'mermaid') {
            this.renderMermaidView();
        }
    }

    // Update step navigation controls
    updateStepControls() {
        const prevButton = document.getElementById('prevStep');
        const nextButton = document.getElementById('nextStep');
        const currentLevelSpan = document.getElementById('currentLevel');
        const totalLevelsSpan = document.getElementById('totalLevels');

        if (!this.currentHierarchy) {
            prevButton.disabled = true;
            nextButton.disabled = true;
            currentLevelSpan.textContent = '0';
            totalLevelsSpan.textContent = '0';
            return;
        }

        const maxLevel = this.currentHierarchy.maxLevel || 0;
        
        prevButton.disabled = this.currentStepLevel <= 0;
        nextButton.disabled = this.currentStepLevel >= maxLevel;
        currentLevelSpan.textContent = this.currentStepLevel;
        totalLevelsSpan.textContent = maxLevel;
    }

    // Navigate to next step
    nextStep() {
        if (this.currentHierarchy && this.currentStepLevel < this.currentHierarchy.maxLevel) {
            this.currentStepLevel++;
            this.renderStepView(this.currentHierarchy);
            this.updateStepControls();
        }
    }

    // Navigate to previous step
    prevStep() {
        if (this.currentStepLevel > 0) {
            this.currentStepLevel--;
            this.renderStepView(this.currentHierarchy);
            this.updateStepControls();
        }
    }

    // Render Mermaid.js flowchart view
    async renderMermaidView() {
        const mermaidView = document.getElementById('mermaidView');
        const mermaidContent = document.getElementById('mermaidContent');
        const mermaidCode = document.getElementById('mermaidCode');
        const mermaidCodeContent = document.getElementById('mermaidCodeContent');
        
        mermaidContent.innerHTML = '<div class="loading-message">Loading Mermaid chart...</div>';
        mermaidCode.style.display = 'none';

        if (!this.currentHierarchy) {
            mermaidContent.innerHTML = '<div class="empty-message"><p>No flow hierarchy loaded.</p></div>';
            return;
        }

        try {
            // Fetch Mermaid.js code from server
            const response = await fetch(`/api/flows/mermaid/${encodeURIComponent(this.currentHierarchy.startingTable)}`);
            const result = await response.json();

            if (result.success) {
                this.currentMermaidData = result.data;
                
                // Display Mermaid.js code
                mermaidCodeContent.textContent = result.data.mermaidCode;
                mermaidCode.style.display = 'block';

                // Initialize Mermaid.js if not already done
                if (!this.mermaidInitialized) {
                    mermaid.initialize({
                        startOnLoad: true,
                        theme: 'default',
                        flowchart: {
                            useMaxWidth: true,
                            htmlLabels: true
                        }
                    });
                    this.mermaidInitialized = true;
                }

                // Render the Mermaid chart
                mermaidContent.innerHTML = `<div class="mermaid">${result.data.mermaidCode}</div>`;
                
                // Re-render to ensure proper display
                mermaid.init(undefined, mermaidContent.querySelector('.mermaid'));
                
            } else {
                mermaidContent.innerHTML = `<div class="error-message"><p>Failed to generate Mermaid chart: ${result.error}</p></div>`;
            }
        } catch (error) {
            console.error('Error rendering Mermaid view:', error);
            mermaidContent.innerHTML = `<div class="error-message"><p>Error loading Mermaid chart: ${error.message}</p></div>`;
        }
    }

    // Copy Mermaid.js code to clipboard
    copyMermaidCode() {
        if (this.currentMermaidData) {
            navigator.clipboard.writeText(this.currentMermaidData.mermaidCode)
                .then(() => {
                    alert('Mermaid.js code copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy Mermaid code:', err);
                    alert('Failed to copy Mermaid code to clipboard');
                });
        }
    }

    // Download Mermaid chart as SVG
    downloadMermaidSVG() {
        if (!this.currentMermaidData) return;

        const svgElement = document.querySelector('#mermaidContent svg');
        if (!svgElement) {
            alert('No SVG chart available to download');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `flowchart-${this.currentHierarchy.startingTable}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Set current hierarchy and reset view state
    setHierarchy(hierarchy) {
        this.currentHierarchy = hierarchy;
        this.currentStepLevel = 0;
        this.renderTreeView(hierarchy);
        this.updateStepControls();
    }
}

// Main application controller
class AppController {
    constructor() {
        this.flowVisualizer = new FlowVisualizer(document.getElementById('visualizationSection'));
        this.currentTable = null;
        this.initializeEventListeners();
        this.loadAvailableTables();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Table selection
        document.getElementById('tableSelect').addEventListener('change', (e) => {
            const loadButton = document.getElementById('loadHierarchy');
            loadButton.disabled = !e.target.value;
        });

        // Load hierarchy button
        document.getElementById('loadHierarchy').addEventListener('click', () => {
            const selectedTable = document.getElementById('tableSelect').value;
            if (selectedTable) {
                this.loadFlowHierarchy(selectedTable);
            }
        });

        // View mode toggle
        document.getElementById('treeViewBtn').addEventListener('click', () => {
            this.flowVisualizer.toggleView('tree');
        });

        document.getElementById('stepViewBtn').addEventListener('click', () => {
            this.flowVisualizer.toggleView('step');
        });

        document.getElementById('mermaidViewBtn').addEventListener('click', () => {
            this.flowVisualizer.toggleView('mermaid');
        });

        // Step navigation
        document.getElementById('nextStep').addEventListener('click', () => {
            this.flowVisualizer.nextStep();
        });

        document.getElementById('prevStep').addEventListener('click', () => {
            this.flowVisualizer.prevStep();
        });

        // Mermaid controls
        document.getElementById('copyMermaidBtn').addEventListener('click', () => {
            this.flowVisualizer.copyMermaidCode();
        });

        document.getElementById('downloadMermaidBtn').addEventListener('click', () => {
            this.flowVisualizer.downloadMermaidSVG();
        });

        // Retry button
        document.getElementById('retryButton').addEventListener('click', () => {
            if (this.currentTable) {
                this.loadFlowHierarchy(this.currentTable);
            }
        });
    }

    // Show loading state
    showLoading() {
        this.hideAllSections();
        document.getElementById('loadingSection').style.display = 'block';
    }

    // Show error state
    showError(message) {
        this.hideAllSections();
        document.getElementById('errorSection').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }

    // Show visualization
    showVisualization() {
        this.hideAllSections();
        document.getElementById('visualizationSection').style.display = 'block';
    }

    // Show empty state
    showEmptyState() {
        this.hideAllSections();
        document.getElementById('emptySection').style.display = 'block';
    }

    // Hide all sections
    hideAllSections() {
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'none';
        document.getElementById('visualizationSection').style.display = 'none';
        document.getElementById('emptySection').style.display = 'none';
    }

    // Load available tables from API
    async loadAvailableTables() {
        try {
            const response = await fetch('/api/flows/tables');
            const result = await response.json();

            if (result.success) {
                this.populateTableSelect(result.data);
            } else {
                console.error('Failed to load tables:', result.error);
            }
        } catch (error) {
            console.error('Error loading tables:', error);
        }
    }

    // Populate table selection dropdown
    populateTableSelect(tables) {
        const select = document.getElementById('tableSelect');
        
        // Clear existing options except the first placeholder
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Add table options
        tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table;
            option.textContent = table;
            select.appendChild(option);
        });
    }

    // Load flow hierarchy for selected table
    async loadFlowHierarchy(tableName) {
        this.currentTable = tableName;
        this.showLoading();

        try {
            const response = await fetch(`/api/flows/hierarchy/${encodeURIComponent(tableName)}`);
            const result = await response.json();

            if (result.success) {
                this.displayFlowHierarchy(result.data, tableName);
            } else {
                this.showError(result.error || 'Failed to load flow hierarchy');
            }
        } catch (error) {
            console.error('Error loading flow hierarchy:', error);
            this.showError('Network error: Failed to load flow hierarchy');
        }
    }

    // Display the loaded flow hierarchy
    displayFlowHierarchy(data, tableName) {
        this.showVisualization();

        // Update header information
        document.getElementById('currentTable').textContent = tableName;
        document.getElementById('levelCount').textContent = data.hierarchy.maxLevel + 1; // +1 for level 0
        document.getElementById('flowCount').textContent = data.hierarchy.nodes.length;

        // Set hierarchy in visualizer
        this.flowVisualizer.setHierarchy(data.hierarchy);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});
