# MyBackHaul Landing Page

This is the main entry point for the MyBackHaul application.

## Running the Landing Page

From the `landing` directory, run:

```bash
python3 -m http.server 3000
```

Or use npm:

```bash
npm run dev
```

The landing page will be available at: http://localhost:3000

## Navigation

The landing page allows users to choose their portal:

- **Driver Portal**: http://localhost:5173 - For drivers looking for backhaul opportunities
- **Distributor Portal**: http://localhost:5175 - For distributors posting loads and managing shipments

## Development Setup

Make sure both applications are running:

1. **Client (Driver) App**:
   ```bash
   cd ../client
   npm run dev
   ```
   Runs on: http://localhost:5173

2. **Distributor App**:
   ```bash
   cd ../distributor
   npm run dev
   ```
   Runs on: http://localhost:5175

3. **Landing Page**:
   ```bash
   cd ../landing
   python3 -m http.server 3000
   ```
   Runs on: http://localhost:3000
