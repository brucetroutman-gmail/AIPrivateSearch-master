# Tester Setup Instructions

## Quick Setup for Testing

1. **Set Environment to Development**
   ```bash
   cd server/s01_server-first-app
   echo "NODE_ENV=development" > .env
   ```

2. **Start the Application**
   ```bash
   # From project root
   ./start.sh
   ```

3. **Access the App**
   - Open browser to: http://localhost:3000
   - No API keys needed in development mode

## Alternative: Use API Keys

If you prefer to test with auth enabled:

1. **Create .env file**
   ```bash
   cd server/s01_server-first-app
   cp .env.example .env
   ```

2. **Edit .env file**
   ```
   API_KEY=test-key-123
   ADMIN_KEY=admin-key-456
   NODE_ENV=production
   ```

3. **Configure Client**
   - The client will need to send `X-API-Key: test-key-123` header
   - Or modify client code to include the key

## Troubleshooting

- If you get "Unauthorized" errors, ensure `NODE_ENV=development` is set
- Check that the server is running on port 3001
- Verify client is accessing http://localhost:3000