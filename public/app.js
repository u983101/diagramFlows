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

        // Create interactive step-through interface
        const stepInterface = document.createElement('div');
        stepInterface.className = 'step-interface';

        // Add breadcrumb navigation
        const breadcrumb = this.createBreadcrumb();
        stepInterface.appendChild(breadcrumb);

        // Add current step selection
        const currentStep = this.createCurrentStep();
        stepInterface.appendChild(currentStep);

        // Add path visualization
        const pathVisualization = this.createPathVisualization();
        stepInterface.appendChild(pathVisualization);

        // Add action buttons
        const actionButtons = this.createActionButtons();
        stepInterface.appendChild(actionButtons);

        stepContent.appendChild(stepInterface);
    }

    // Create breadcrumb navigation
    createBreadcrumb() {
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb';

        const breadcrumbList = document.createElement('div');
        breadcrumbList.className = 'breadcrumb-list';

        if (this.currentPath && this.currentPath.length > 0) {
            this.currentPath.forEach((segment, index) => {
                const breadcrumbItem = document.createElement('span');
                breadcrumbItem.className = 'breadcrumb-item';
                breadcrumbItem.textContent = segment;
                
                // Make items clickable to navigate back
                if (index < this.currentPath.length - 1) {
                    breadcrumbItem.classList.add('clickable');
                    breadcrumbItem.addEventListener('click', () => {
                        this.navigateToStep(index);
                    });
                }

                breadcrumbList.appendChild(breadcrumbItem);

                // Add separator if not last item
                if (index < this.currentPath.length - 1) {
                    const separator = document.createElement('span');
                    separator.className = 'breadcrumb-separator';
                    separator.textContent = ' → ';
                    breadcrumbList.appendChild(separator);
                }
            });
        } else {
            const emptyBreadcrumb = document.createElement('span');
            emptyBreadcrumb.className = 'breadcrumb-empty';
            emptyBreadcrumb.textContent = 'Select a starting table to begin';
            breadcrumbList.appendChild(emptyBreadcrumb);
        }

        breadcrumb.appendChild(breadcrumbList);
        return breadcrumb;
    }

    // Create current step selection interface
    createCurrentStep() {
        const currentStep = document.createElement('div');
        currentStep.className = 'current-step';

        const stepHeader = document.createElement('h3');
        stepHeader.className = 'step-header';

        if (!this.currentPath || this.currentPath.length === 0) {
            // Starting step - select flows for initial table
            stepHeader.textContent = 'Select Flows';
            currentStep.appendChild(stepHeader);
            
            const flowSelection = this.createFlowSelection(this.currentHierarchy.startingTable);
            currentStep.appendChild(flowSelection);
        } else {
            const lastSegment = this.currentPath[this.currentPath.length - 1];
            
            // Check if we're at the starting point (only starting table in path)
            if (this.currentPath.length === 1) {
                // Starting step - select flows for initial table
                stepHeader.textContent = 'Select Flows';
                currentStep.appendChild(stepHeader);
                
                const flowSelection = this.createFlowSelection(this.currentHierarchy.startingTable);
                currentStep.appendChild(flowSelection);
            } else if (this.currentPath.length % 2 === 1) {
                // Last segment is a table - select flows
                stepHeader.textContent = `Select Flows for ${lastSegment}`;
                currentStep.appendChild(stepHeader);
                
                const flowSelection = this.createFlowSelection(lastSegment);
                currentStep.appendChild(flowSelection);
            } else {
                // Last segment is a flow - select output tables
                stepHeader.textContent = `Select Output Tables for ${lastSegment}`;
                currentStep.appendChild(stepHeader);
                
                const tableSelection = this.createTableSelection([lastSegment]);
                currentStep.appendChild(tableSelection);
            }
        }

        return currentStep;
    }

    // Create flow selection interface
    createFlowSelection(tableName) {
        const flowSelection = document.createElement('div');
        flowSelection.className = 'selection-container';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search flows...';
        searchInput.className = 'search-input';
        flowSelection.appendChild(searchInput);

        const flowList = document.createElement('div');
        flowList.className = 'selection-list';
        flowSelection.appendChild(flowList);

        // Load flows for the table
        this.loadFlowsForTable(tableName).then(flows => {
            this.renderFlowList(flowList, flows, searchInput);
        });

        return flowSelection;
    }

    // Create table selection interface
    createTableSelection(flowNames) {
        const tableSelection = document.createElement('div');
        tableSelection.className = 'selection-container';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search tables...';
        searchInput.className = 'search-input';
        tableSelection.appendChild(searchInput);

        const tableList = document.createElement('div');
        tableList.className = 'selection-list';
        tableSelection.appendChild(tableList);

        // Load tables from flows
        this.loadTablesFromFlows(flowNames).then(tables => {
            this.renderTableList(tableList, tables, searchInput);
        });

        return tableSelection;
    }

    // Load flows for a specific table
    async loadFlowsForTable(tableName) {
        try {
            const response = await fetch(`/api/flows/table/${encodeURIComponent(tableName)}/flows`);
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to load flows:', result.error);
                return [];
            }
        } catch (error) {
            console.error('Error loading flows:', error);
            return [];
        }
    }

    // Load tables from specific flows
    async loadTablesFromFlows(flowNames) {
        try {
            const response = await fetch('/api/flows/flows/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ flowNames })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to load tables:', result.error);
                return [];
            }
        } catch (error) {
            console.error('Error loading tables:', error);
            return [];
        }
    }

    // Render flow list with search functionality
    renderFlowList(container, flows, searchInput) {
        const renderList = (filteredFlows) => {
            container.innerHTML = '';
            
            if (filteredFlows.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-selection';
                emptyMessage.textContent = 'No flows found';
                container.appendChild(emptyMessage);
                return;
            }

            filteredFlows.forEach(flow => {
                const flowItem = document.createElement('div');
                flowItem.className = 'selection-item';
                flowItem.innerHTML = `
                    <div class="item-name">${flow.name}</div>
                    <div class="item-details">
                        <span class="trigger-badge ${flow.trigger}">${flow.trigger}</span>
                        ${flow.inputDatabase ? `<span>Input: ${flow.inputDatabase.name}</span>` : ''}
                    </div>
                `;
                
                flowItem.addEventListener('click', () => {
                    this.addToPath(flow.name);
                });

                container.appendChild(flowItem);
            });
        };

        // Initial render
        renderList(flows);

        // Add search functionality
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredFlows = flows.filter(flow => 
                flow.name.toLowerCase().includes(searchTerm)
            );
            renderList(filteredFlows);
        });
    }

    // Render table list with search functionality
    renderTableList(container, tables, searchInput) {
        const renderList = (filteredTables) => {
            container.innerHTML = '';
            
            if (filteredTables.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-selection';
                emptyMessage.textContent = 'No tables found';
                container.appendChild(emptyMessage);
                return;
            }

            filteredTables.forEach(table => {
                const tableItem = document.createElement('div');
                tableItem.className = 'selection-item';
                tableItem.innerHTML = `
                    <div class="item-name">${table}</div>
                    <div class="item-details">Database Table</div>
                `;
                
                tableItem.addEventListener('click', () => {
                    this.addToPath(table);
                });

                container.appendChild(tableItem);
            });
        };

        // Initial render
        renderList(tables);

        // Add search functionality
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredTables = tables.filter(table => 
                table.toLowerCase().includes(searchTerm)
            );
            renderList(filteredTables);
        });
    }

    // Add segment to path
    addToPath(segment) {
        if (!this.currentPath) {
            this.currentPath = [this.currentHierarchy.startingTable];
        }
        
        this.currentPath.push(segment);
        this.renderStepView(this.currentHierarchy);
    }

    // Navigate to specific step in path
    navigateToStep(stepIndex) {
        if (this.currentPath && stepIndex >= 0 && stepIndex < this.currentPath.length) {
            this.currentPath = this.currentPath.slice(0, stepIndex + 1);
            this.renderStepView(this.currentHierarchy);
        }
    }

    // Create path visualization
    createPathVisualization() {
        const pathViz = document.createElement('div');
        pathViz.className = 'path-visualization';

        const pathHeader = document.createElement('h4');
        pathHeader.textContent = 'Current Path';
        pathViz.appendChild(pathHeader);

        const pathDisplay = document.createElement('div');
        pathDisplay.className = 'path-display';

        if (this.currentPath && this.currentPath.length > 0) {
            const pathText = this.currentPath.join(' → ');
            pathDisplay.textContent = pathText;
        } else {
            pathDisplay.textContent = 'No path selected';
            pathDisplay.className += ' empty-path';
        }

        pathViz.appendChild(pathDisplay);
        return pathViz;
    }

    // Create action buttons
    createActionButtons() {
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';

        const startOverBtn = document.createElement('button');
        startOverBtn.textContent = 'Start Over';
        startOverBtn.className = 'btn-secondary';
        startOverBtn.addEventListener('click', () => {
            this.currentPath = null;
            this.renderStepView(this.currentHierarchy);
        });

        const generateDiagramBtn = document.createElement('button');
        generateDiagramBtn.textContent = 'Generate Mermaid Diagram';
        generateDiagramBtn.className = 'btn-primary';
        generateDiagramBtn.addEventListener('click', () => {
            this.generatePathDiagram();
        });

        // Disable generate button if no path or path is incomplete
        if (!this.currentPath || this.currentPath.length < 2) {
            generateDiagramBtn.disabled = true;
        }

        actionButtons.appendChild(startOverBtn);
        actionButtons.appendChild(generateDiagramBtn);

        return actionButtons;
    }

    // Generate Mermaid diagram for current path
    async generatePathDiagram() {
        if (!this.currentPath || this.currentPath.length < 2) {
            alert('Please build a path first');
            return;
        }

        try {
            const response = await fetch('/api/flows/mermaid/path', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path: this.currentPath })
            });
            const result = await response.json();

            if (result.success) {
                // Switch to Mermaid view and display the path diagram
                this.currentMermaidData = result.data;
                this.renderPathMermaidView();
            } else {
                alert('Failed to generate diagram: ' + result.error);
            }
        } catch (error) {
            console.error('Error generating path diagram:', error);
            alert('Error generating diagram: ' + error.message);
        }
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
            // If we have a current path, generate path-specific diagram
            // Otherwise, generate full hierarchy diagram
            if (this.currentPath && this.currentPath.length >= 2) {
                this.generatePathDiagram();
            } else {
                this.renderMermaidView();
            }
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

    // Render Mermaid diagram for current path
    renderPathMermaidView() {
        const mermaidView = document.getElementById('mermaidView');
        const mermaidContent = document.getElementById('mermaidContent');
        const mermaidCode = document.getElementById('mermaidCode');
        const mermaidCodeContent = document.getElementById('mermaidCodeContent');
        
        // Switch to Mermaid view
        this.currentView = 'mermaid';
        
        // Update active button states
        document.getElementById('treeViewBtn').classList.toggle('active', false);
        document.getElementById('stepViewBtn').classList.toggle('active', false);
        document.getElementById('mermaidViewBtn').classList.toggle('active', true);

        // Show/hide views
        document.getElementById('treeView').classList.toggle('active', false);
        document.getElementById('stepView').classList.toggle('active', false);
        document.getElementById('mermaidView').classList.toggle('active', true);

        // Display the path diagram
        mermaidContent.innerHTML = '<div class="loading-message">Loading path diagram...</div>';
        mermaidCode.style.display = 'none';

        if (!this.currentMermaidData) {
            mermaidContent.innerHTML = '<div class="empty-message"><p>No path diagram data available.</p></div>';
            return;
        }

        try {
            // Display Mermaid.js code
            mermaidCodeContent.textContent = this.currentMermaidData.mermaidCode;
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
            mermaidContent.innerHTML = `<div class="mermaid">${this.currentMermaidData.mermaidCode}</div>`;
            
            // Re-render to ensure proper display
            mermaid.init(undefined, mermaidContent.querySelector('.mermaid'));
            
        } catch (error) {
            console.error('Error rendering path Mermaid view:', error);
            mermaidContent.innerHTML = `<div class="error-message"><p>Error loading path diagram: ${error.message}</p></div>`;
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
        // Initialize the path with the starting table
        this.currentPath = [hierarchy.startingTable];
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
        // Table search functionality
        const tableSearch = document.getElementById('tableSearch');
        const tableSelect = document.getElementById('tableSelect');
        
        tableSearch.addEventListener('input', (e) => {
            this.filterTables(e.target.value);
        });

        tableSearch.addEventListener('focus', () => {
            tableSelect.style.display = 'block';
            this.filterTables(tableSearch.value);
        });

        tableSearch.addEventListener('blur', () => {
            // Hide dropdown after a short delay to allow for selection
            setTimeout(() => {
                tableSelect.style.display = 'none';
            }, 200);
        });

        // Table selection
        tableSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            const loadButton = document.getElementById('loadHierarchy');
            loadButton.disabled = !selectedValue;
            
            if (selectedValue) {
                tableSearch.value = e.target.options[e.target.selectedIndex].text;
            }
        });

        tableSelect.addEventListener('click', (e) => {
            if (e.target.tagName === 'OPTION') {
                tableSelect.blur();
            }
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

        // Store the original tables for filtering
        this.allTables = tables;
    }

    // Filter tables based on search input
    filterTables(searchTerm) {
        const select = document.getElementById('tableSelect');
        const searchInput = document.getElementById('tableSearch');
        
        // Clear all options except the placeholder
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        if (!searchTerm) {
            // Show all tables when search is empty
            this.allTables.forEach(table => {
                const option = document.createElement('option');
                option.value = table;
                option.textContent = table;
                select.appendChild(option);
            });
        } else {
            // Filter tables based on search term (case-insensitive)
            const filteredTables = this.allTables.filter(table => 
                table.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredTables.length === 0) {
                // Show "No results" message
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No matching tables found';
                option.disabled = true;
                select.appendChild(option);
            } else {
                // Add filtered tables
                filteredTables.forEach(table => {
                    const option = document.createElement('option');
                    option.value = table;
                    option.textContent = table;
                    select.appendChild(option);
                });
            }
        }

        // Reset selection when filtering
        select.value = '';
        document.getElementById('loadHierarchy').disabled = true;
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
