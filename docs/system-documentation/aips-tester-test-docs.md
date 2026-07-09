# AIPrivateSearch Tester Guide: Test Collections

This guide walks you through purchasing a Professional license, downloading, installing, and running the full test-collections test suite.

---

## Step 1: Purchase Professional Tier

1. Browse to **custmgr.AIPrivateSearch.com/login.html**, enter your credentials and click **Login**. (Or create an account and login.)
2. On the **My Account** page click **Change Tier**, click **Professional**, click **Continue to Payment**.
3. On the Stripe page click **Pay without Link**. Enter:
   - **Card number**: `4242 4242 4242 4242`
   - **MM/YY**: `01/30`
   - **CVC**: `123`
   - Your name and ZIP code
4. Click **Subscribe**.
5. Back on **My Account**, click **Download Installer**. Save to your Downloads folder.

---

## Step 2: Download & Mount

1. From your **Downloads** folder, double-click **aiprivatesearch.dmg**
2. Drag the **AIPrivateSearch** icon to the **Applications** folder

---

## Step 3: Uninstall (if previously installed)

1. Open the **AIPrivateSearch** app
2. Click **Update**, then click **Uninstall**, then click **Uninstall**, then click **No**
3. After it finishes, click **OK**

---

## Step 4: Install

1. Open the **AIPrivateSearch** app
2. Click **Install**, then click **No**
3. Click **Start 60-day free trial**
4. Enter your email address and click **Activate License**
   - If your email doesn't work, click the **Register Here** link to create an account first

---

## Step 5: Run Test Collections

1. Go to **http://localhost:56305n copy the selected rows from the tables searches/test-collections.html**
2. Select all models using the model checkboxes at the top
3. Select All tests using the checkbox
4. Click **Execute Selected Tests**
5. Watch the progress bar below — each test runs sequentially
6. When complete, the summary table shows scores for each test

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 3000 busy | Close all Terminal windows, re-open AIPrivateSearch app |
| No models in dropdown | Wait for Ollama model pull to complete |
| Tests not saving to DB | Check `.env-aips` file exists in `/Users/Shared/AIPrivateSearch/` |
| Score model causes crash | Do not use `nomic-embed-text` as score model — use a chat model |
