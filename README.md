# Database Flow Visualizer

A JavaScript Express application for visualizing database flow hierarchies with toggleable views and server-side traversal logic.

## Features

- **Interactive Flow Visualization**: Select a starting database table and visualize the complete flow hierarchy
- **Toggleable Views**: Switch between Tree View and Step-by-Step View
- **Server-Side Processing**: Recursive flow traversal with cycle detection
- **Responsive Design**: Clean, modern interface that works on desktop and mobile
- **Real-time Loading States**: Progress indicators and error handling

## Project Structure

```
diagramGenerator/
├── package.json          # Project dependencies and scripts
├── server.js             # Express server configuration
├── routes/
│   └── flows.js          # API route handlers for flow data
├── utils/
│   └── flowTraversal.js  # Server-side flow traversal logic
├── public/
│   ├── index.html        # Main application interface
│   ├── app.js            # Client-side JavaScript for UI interactions
│   ├── styles.css        # Application styling
│   └── output.json       # Sample flow data
└── README.md             # This file
```

## Installation

1. Clone or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. Select a starting database table from the dropdown
4. Click "Load Flow Hierarchy" to visualize the flow
5. Toggle between Tree View and Step-by-Step View using the view controls

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/flows/tables` - Get available starting tables
- `GET /api/flows/hierarchy/:tableName` - Get flow hierarchy for a table
- `GET /api/flows/hierarchy/:tableName/level/:level` - Get flows at specific level
- `GET /api/flows` - Get all flows (debugging)

## Data Structure

The application uses a JSON-based flow definition format:

```json
{
  "databases": [
    {"name": "database_name"}
  ],
  "flows": [
    {
      "name": "flow_name",
      "trigger": "manual" | "database",
      "inputDatabase": {
        "name": "table_name",
        "trigger": 5,
        "fields": ["field1", "field2"]
      },
      "outputDatabases": [
        {
          "name": "table_name",
          "action": "create" | "update" | "delete",
          "fields": ["field1", "field2"]
        }
      ]
    }
  ]
}
```

## Flow Traversal Logic

The application implements a recursive algorithm that:

1. Starts from a selected database table
2. Finds all flows triggered by that table
3. Recursively processes output databases from those flows
4. Prevents infinite loops using visited sets
5. Builds a hierarchical structure with levels

## Development

- **Development Server**: `npm run dev` (uses nodemon for auto-restart)
- **Production Server**: `npm start`
- **Testing**: `npm test` (test framework to be implemented)

## Technologies Used

- **Backend**: Express.js, CORS middleware
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Development**: Nodemon for auto-restart
- **Data**: JSON-based flow definitions

## Sample Data

The application comes with sample data showing:
- 3 databases: `case`, `task`, `integration_core`
- 2 flows demonstrating database-triggered flow hierarchy

## Contributing

1. Follow the existing code structure and naming conventions
2. Add appropriate error handling and validation
3. Test all API endpoints and UI interactions
4. Update documentation for new features

## License

MIT License - see LICENSE file for details