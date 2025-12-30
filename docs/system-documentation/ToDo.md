to do AIPrivateSearch

## PENDING TASKS

### High Priority
15. Can We make an electron app for this that runs locally on a mac? --started
22. Implement local documents only. --done
124. Create a quick start guide.
128. ** Make Response matches and View Document consistent across all types, Add View Index Card to Doc Index Cards response
131. create app for load-AIPrivateSearch-xxxx.command  --started
147. why does Smart Search return both matches and non matches?
226. Create marketing website/landing page for AIPrivateSearch
227. Implement backup/restore functionality for user data and collections
228. Add bulk document upload with progress indicators
229. Create mobile-responsive design improvements
230. Implement search result export (PDF/CSV) functionality


### User Management System
133. Implement complete user management and 3-tier role system with external SecureAccess integration:

Phase 1 - User Management Infrastructure: --done
- Create internal user management system with database tables (users, roles, permissions, sessions) --done
- Implement user authentication/authorization middleware --done
- Build user management UI (add/edit/delete users, assign roles) --done
- Create register/login/logout functionality with session management --done

133.1 create AIPrivateSearch-User-Management-System.md. Describe the system, its database schema, Security features and set by step instructions to get started. --done

Phase 2 - SecureAccess Integration:
- Implement external API connection to SecureAccess user management software
- Create authentication bridge between internal system and SecureAccess
- Sync user data, roles, and licensing status from SecureAccess
- Handle license validation and computer limits

Phase 3 - Role-Based Feature Control:
- Standard: Free 4 months then $49/yr, 1 computer, admin/searcher roles only, menu: search, multi-mode, manage collections, options/dark mode, admin can add users, cannot modify doc index cards, can change search models but not parameters, cannot change score model/parameters
- Premium: $199/yr, 5 computers, all Standard features plus manage models, modify config files, modify doc index cards, 
- Professional: $2999 license, all menu items, no code emails, full access

148. Create user database schema and authentication system (prerequisite for task 133)
149. Build SecureAccess API integration layer (prerequisite for task 133) 
150. Implement role-based UI restrictions and feature gating (prerequisite for task 133)

### Business & Marketing
241. Create professional product screenshots and demo videos
242. Develop pricing strategy and subscription management system
243. Create HIPAA compliance documentation and certification
244. Develop partner program for resellers (medical/legal consultants)
245. Create case studies for medical practices and law firms
246. Implement usage analytics and telemetry (privacy-compliant)
247. Create installer packages for easy deployment
248. Develop customer support system and documentation
249. Create competitive analysis and positioning documents
250. Implement license key management system

### Enhancement Tasks
28. User and system propmt by source type
32. Re-Visit the Test Codes - focus on speed and document search testing --started
120. create user prompts based on source Type and collection and search type
121. focus on display and layout  --started
122. review processing of each search type. creaate 3 prompts for sourcetype, collection, searchtype. Store prompts in .json configs
126. enhance database saving add documents only
135. review chunking..chunk size small and large documents  many documents are only 2 chunks what are the pros and cons of changing chunks sizes
231. Add search history and saved searches functionality
232. Implement document preview without full download
233. Create admin dashboard with usage analytics
234. Add keyboard shortcuts for power users
236. Create API documentation for potential integrations
238. Implement search performance optimization and caching
239. Create user onboarding tutorial/wizard

### Current Tasks
290. Update mysql tables for new column SearchMethodType. be sure the code reflects this column ie number of colums match.
296. Create testCodes for DocumentSearch performance 
300. As of  11/20/25 login and tier checking via license check are not connected. We need this disabled for testing. We will need to obtain tier level  from licence check  after testing.
335. Test multi search and view documents
336. Test multi prompts and ascii characters.
337. Test Login and roles... srch-std gets wrong menus after login

=======================================================

## RECENTLY COMPLETED (v19.84)
350. Updated license-activation.html to connect directly to CustMgr server instead of local backend --done
351. Added proper hardware ID binding and CustMgr API integration for license activation --done
352. Created comprehensive CustMgr license fix test plan (AIPS-custmgr-license-fix.md) --done
353. Fixed license activation flow to bypass local server and connect directly to custmgr.aiprivatesearch.com:56304 --done

## RECENTLY COMPLETED (v19.83)
343. Fixed license activation system with complete database schema setup --done
344. Resolved CustMgr server database issues (customer_code, subscription_tier, licenses table, hw_hash column) --done
345. Fixed client-side redirect loops in license activation flow --done
346. Implemented proper user flow: index.html → Get Started → license-activation.html → activation success --done
347. Updated TTS web interface with correct macOS voice options (Fred, Samantha, Daniel, Moira, etc.) --done
348. Fixed startup-license-check.js to prevent automatic redirects for unlicensed users --done
349. Corrected "Get Started" button to link to license-activation.html instead of user-management.html --done

## RECENTLY COMPLETED (v19.82)
342. Rename demo page to videos.html and remove "Demo" from page title --done

## RECENTLY COMPLETED (v19.81)
341. Change button text from "Watch Demos" to "Watch Videos" on index page --done

## RECENTLY COMPLETED (v19.80)
337. Implement 72-hour license caching to reduce server load and improve performance --done
338. Add refresh license button to user-management page for tier upgrades --done
339. Fix index page loading delay by inlining header/footer content --done
340. Reorder CTA buttons on index page (Search, Manage Collections, Watch Demos) --done
336. Move License info to user-management --done

## RECENTLY COMPLETED (v19.79)
332. Fix search logs viewer to display correct data fields (prompt, collectionName, documentsFound, searchDurationSeconds) --done
333. Change search logs duration display from milliseconds to seconds format --done
303. Research unoconv+ libreoffice for document conversions --done
292. Create Search Logs feature, create export to mySQL feature --done
293. Test log creation and mysql update. not all elements are being saved --done
294. Complete Guides page and move to marketing Guides page --done
302. Use this apps footer on aiprivatesearchweb and aiprivatesearchcustmgr copy any needed pages --done

## RECENTLY COMPLETED (v19.78)
304. Test app_token --done
305. Fix app_token API inconsistency - use dot notation for get/set methods --done
306. Add comprehensive error handling and user feedback for app_token operations --done
307. Implement automated tests for app_token migration and CRUD operations --done 
331. Complete app_token production readiness with dot notation API, comprehensive error handling, and automated test suite --done

## RECENTLY COMPLETED (v19.77)
330. Fix no-data-share.sh demo script Metal GPU initialization errors by identifying reboot requirement for proper Ollama functionality --done

## RECENTLY COMPLETED (v19.76)
329. Improve no-data-share.sh demo script with better network monitoring, Ollama-specific connection filtering, and clearer privacy demonstration output --done

## RECENTLY COMPLETED (v19.75)
328. Create comprehensive test plan for app_token system implementation with unit tests, integration tests, performance benchmarks, security validation, and 8-day test schedule --done

## RECENTLY COMPLETED (v19.74)
326. Move demo page styles from inline CSS to shared styles.css for better maintainability --done
327. Copy demo.html to aiprivatesearchweb repo for marketing site integration --done

## RECENTLY COMPLETED (v19.73)
325. Convert demo page to use standard app template with header, footer, and all standard functionality --done

## RECENTLY COMPLETED (v19.72)
322. Create comprehensive demo script and narration for YouTube video with step-by-step Snagit recording instructions --done
323. Create executive summary document separate from technical specifications --done
324. Optimize narration script for ElevenLabs TTS with pronunciation guides and pacing markers --done

## RECENTLY COMPLETED (v19.71)
321. Update footer links in dark mode to use light blue (#87ceeb) color for Privacy Policy, Terms of Service, and Contact links --done

## RECENTLY COMPLETED (v19.70)
320. Fix content alignment issues after footer implementation by restoring working styles.css and index.html from git commit b4cee5c --done

## RECENTLY COMPLETED (v19.69)
316. Move inline styles to CSS classes across all three applications --done
317. Add CSS classes for Sherlock icons, CTA buttons, and common UI elements --done
318. Update all index.html files to use CSS classes instead of inline styles --done
319. Copy updated styles.css to aiprivatesearchweb and aiprivatesearchcustmgr --done

## RECENTLY COMPLETED (v19.68)
301. Updated to sherlock icons  --done
313. Update index page icons to use AIPrivateSearch-Sherlock.png with 100px max-width --done
314. Add Sherlock icons to aiprivatesearchweb and aiprivatesearchcustmgr index pages --done
315. Copy AIPrivateSearch-Sherlock.png to assets folders for all three applications --done

## RECENTLY COMPLETED (v19.67)
310. Fix custmgr licensing server authentication by adding /api/licensing/ endpoints to auth exclusion list --done
311. Remove fallback defaults from license-client.mjs to force configuration-only operation --done
312. Update custmgr configuration to use domain name (custmgr.aiprivatesearch.com) instead of IP address --done

## RECENTLY COMPLETED (v19.66)
308. Add custmgr location configuration to app.json and replace hardcoded URLs with dynamic config loading --done
309. Remove "– Demo" from tab titles throughout the app --done

## RECENTLY COMPLETED (v19.65)

## RECENTLY COMPLETED (v19.64)

## RECENTLY COMPLETED (v19.63)
297. Create initial app step If no owner email, create email + pccode = key to tier. Registration app --done
298. After activate check app should come to login --done
299. Fix light-to-dark mode flash when switching pages by adding immediate theme loading script to all 23 HTML pages --done
303. Fix licensing post-activation flow - after successful activation, home page shows "no activation" then redirects back to activation page. License checker state management needs debugging --done

## RECENTLY COMPLETED (v19.62)
304. Implement complete JWT-based licensing system with custmgr server integration --done
305. Fix start.sh scripts across all apps to prevent cross-contamination and process conflicts --done
306. Add strict config-only port management with no fallback defaults --done
307. Remove fallback mock license creation to ensure licensing either succeeds or fails with proper error messages --done

## RECENTLY COMPLETED (v19.61)
302. Create updated executive summary for version 19.60 reflecting current enterprise-ready state with user management and security features --done

## RECENTLY COMPLETED (v19.60)
299. Create _template-page.html with all standard loading routines and patterns for new pages --done
300. Fix search logs viewer initialization and file pattern matching to display actual log files --done
301. Complete search logs viewer functionality with date filtering and Professional tier database export --done

## RECENTLY COMPLETED (v19.59)
280. Review testcode strategy to include local docs. Add new testcodes to test page --done
288. Create search logs viewer page to display and analyze logged search activities with date filtering and Professional tier database export --done
295. Is show-hide.json require now, since we are using role-tier? --done (Yes, both needed: show-hide.json for functional visibility, tier-access.json for permission visibility)
296. Update TestCode documentation Position 6 from collection-specific prompts to general User Prompts 1-5 --done
297. Fix TestCode format validation in testcode-checker.html to use correct 10-character format --done
298. Correct TestCode documentation examples and descriptions throughout system --done

## RECENTLY COMPLETED (v19.58)
281. Create comprehensive search logging system with daily JSON files in /Users/Shared/AIPrivateSearch/logs/ --done
282. Add Guides to main menu, create guides page with helpful links, move supported formats from footer --done
287. Centralize all AIPrivateSearch titles to load from App.json configuration --done
289. Analyze local documents search to identify 40+ missing data columns for enhanced analytics --done
291. Create Options Page with Dark Mode and Log Search Results checkboxes, reorganize menu structure by moving Configurations and TestCode Checker to Manage menu --done

## RECENTLY COMPLETED (v19.57)
283. Change menu title from Multi-mode Search to Multi --done
284. Remove version display from header and add to Guides page --done
285. Add version to guides page title and remove tier level display from header --done
286. Change Guides title from AIPrivateSearch Guides to AI Private Search Guides with proper spacing --done

## RECENTLY COMPLETED (v19.56)
278. Copy all config files to Users/Shared/AIPrivateSearch/config folder. Modify app to use config from this location --done
279. Add to release process, copy the config files from Users/Shared/AIPrivateSearch/config to repo/client/c01_client-first-app/config. Modify load script to copy config files from repo to shared config if empty --done

## RECENTLY COMPLETED (v19.55)
277. Fix collections dropdown loading by adding missing GET route for subscription-tier endpoint and adding sources directory to secureFs allowed paths --done
278. Change multi-mode search page title from "Multi-Mode Search" to "Collections Multi-Mode Search" --done

## RECENTLY COMPLETED (v19.54)
275. Fix secureFs wrapper by adding missing mkdir method that UserManager requires for directory creation --done
276. Fix authentication system by adding /Users/Shared/AIPrivateSearch/data to allowed directories in secureFs for user data access --done

## RECENTLY COMPLETED (v19.53)
271. Fix ESLint security issues by adding comprehensive disable comments for legitimate file operations --done
272. Remove debug files (debug-collection-name.mjs, read-doc-index.mjs, test-embedding-search.mjs, check-db.mjs) for clean release --done
273. Fix pre-commit hooks to reference security scripts in correct folder (security/lint.sh, security/security-check.sh) --done
274. Fix cross-machine authentication by adding proper session cleanup when authentication fails on new machines --done

## RECENTLY COMPLETED (v19.52)
267. Hide model temperature, context, and tokens parameters on multi-mode search for Standard tier users by adding prem-only CSS class --done
268. Reorganize user-prompts.json hierarchically with local_model_only and collection-specific prompts for local_documents, fix timing issues in search pages --done
269. Fix multi-mode search layout by reorganizing controls: collection dropdown first, then user prompts, then model selection --done
270. Fix user prompts loading timing issue in multi-mode search by ensuring prompts load after collections are available --done

## RECENTLY COMPLETED (v19.51)
235. Implement document version control and change tracking --done
237. Add automated testing suite for all search methods --done
251. Create sample HR system for small to medium business --done

## RECENTLY COMPLETED (v19.50)
265. Fix collections-editor source file links for YAML, XML, TSV, HTML and other formats by expanding allowed file extensions and adding proper MIME types --done
266. Create comprehensive Type-Test collection with 25+ sample files covering all supported document formats for testing --done

## RECENTLY COMPLETED (v19.49)
240. Add support for additional document formats (PowerPoint, etc.) --done
264. Reorganize collections-editor buttons - Put Process Source Files and Delete Documents on first line (always visible), other buttons on second line (Professional tier only) --done

## RECENTLY COMPLETED (v19.48)
257. Fix config-editor URL parameter parsing with better debugging and fallback handling --done
258. Add comprehensive debugging to config pages for URL parameter troubleshooting --done
259. Fix config-editor URL parameter loss by adding sessionStorage fallback --done
260. Add server-side routing for config-editor to preserve query parameters on custom ports --done
261. Fix menu navigation to config.html and CSRF token timing with dynamic ports --done
262. Fix hardcoded URLs and CSRF timing issues across all pages for dynamic port compatibility --done, test plan created
263. Restrict standard tier users from changing search and score model parameters (Temperature, Context, Tokens) --done

## RECENTLY COMPLETED (v19.47)
253. Fix Manage Collections connection refused error by updating hardcoded API URLs to use dynamic API_BASE_URL --done
254. Fix Modify Config page 404 errors by removing non-existent default.css and updating hardcoded API URLs --done
255. Fix Config file list page by removing non-existent default.css, adding API config, and fixing editor link --done
256. Fix config-editor timing issue by ensuring API config loads before attempting to load file --done
257. Fix config-editor URL parameter parsing with better debugging and fallback handling --done
258. Add comprehensive debugging to config pages for URL parameter troubleshooting --done
259. Fix config-editor URL parameter loss by adding sessionStorage fallback --done
260. Add server-side routing for config-editor to preserve query parameters on custom ports --done

## RECENTLY COMPLETED (v19.46)

## RECENTLY COMPLETED (v19.45)
254. Fix search.js null reference error for removed addMetaPrompt element --done

## RECENTLY COMPLETED (v19.44)
252. Remove "Model Settings" from Options menu as it's already available in Manage dropdown --done

## RECENTLY COMPLETED (v19.43)
218. test srch-prem  --done
219. test adm-prof  --done
220. test srch-prof  --done
221. Consolidate redundant CSS classes - Removed .dev-only class which was functionally identical to .adv-only --done
222. Implement tier-specific CSS classes - Replaced .adv-only with .prem-only (Premium tier 2+) and .pro-only (Professional tier 3 only) --done
223. Update tier-access.json configuration to use precise tier-specific class controls --done
224. Update all HTML files to use new tier-specific classes for better access control granularity --done
225. Remove "Add Meta Prompt" checkbox from search page to simplify user interface --done

## RECENTLY COMPLETED (v19.42)
213. Fix premium administrator menu access - Test and Analyze menus now properly hidden for Premium tier, only visible for Professional tier --done
214. Fix TestCode Checker visibility - Now properly hidden for Premium tier users, only available to Professional tier --done
215. Enable doc index card editing for Premium tier users - Save and Export buttons now visible and functional for premium-admin and premium-searcher --done
216. Resolve CSS conflicts preventing tier access control - Removed conflicting display:none rules that overrode tier access manager --done
217. Add pro-only CSS class for Professional-tier-only features to distinguish from general adv-only features --done

## RECENTLY COMPLETED (v19.41)
211. test srch-std is Ok --done
212. Hide Remove Collection button for searcher roles --done

## RECENTLY COMPLETED (v19.40)
210. create me a checklist for each role-tier for testing with each Role-tier and all menu items that should appear. --done

## RECENTLY COMPLETED (v19.39)
207. Continue testing of auth-session for all roles and tiers. Srch-prem shows the wrong menus: missing User icon and manage collections. --done
209. Document auth-session-security interaction when a new page is called. Is this a common routine? --done

## RECENTLY COMPLETED (v19.38)
208. After successful login the user icon now shows on the header menu for all user types and tiers --done
206. Modernize light theme with improved colors, spacing, and visual hierarchy; set dark mode as default for new users --done
201. Review menu availability for all role/tier combinations - created comprehensive analysis matrix --done
202. Implement role-based menu restrictions with admin-only and searcher-only CSS classes --done
203. Create tier-access.json configuration file for centralized role/tier-based access control --done
204. Change normal mode background from white to light grey (#e8e8e8) for better visual contrast --done
205. Fix text color contrast issues in index.html for medium grey background --done

## RECENTLY COMPLETED (v19.37)
188. Fix security vulnerabilities in common.js by implementing consistent CSRF protection and error handling --done
189. Resolve path traversal vulnerabilities in config routes with proper input validation --done
190. Move hardcoded admin credentials from code to users.json file for better security management --done
191. Complete comprehensive security review and validation - all security-check.sh tests passing --done
192. Create AIPrivateSearch-User-Test-Plan.md with comprehensive testing procedures for all tiers and roles --done
193. Create test results tracking system with tester email, Mac serial number, and JSON storage --done
194. Create step-by-step user-auth-testing-guide.md with detailed testing procedures --done
195. Add subscription tier number display to app title for tester visibility --done
196. Analyze data folder and unified_embeddings.db usage - determined system uses per-collection databases, not unified --done
197. Implement data folder cleanup recommendations - removed unused unified databases and duplicates --done
198. Create /Users/Shared/AIPrivateSearch/data directory and update application to use shared data files --done
199. Fix login issue - secureFileOps was blocking access to shared data directory --done
200. Add data folder copying to release script following same pattern as sources folder --done
201. Update README.md to document data folder copying in release command --done
196. Analyze data folder and unified_embeddings.db usage - determined system uses per-collection databases, not unified --done 

## COMPLETED (v19.36)

## COMPLETED (v19.35)
185. Implement tier-based user isolation where admins only see users from their own subscription tier --done
186. Review application for dead and duplicate code using Amazon Q Security Scan --done
187. Resolve hardcoded credentials security issues by implementing proper .gitignore for sensitive data files --done

## COMPLETED (v19.34)
178. Implement Bearer token authentication system replacing cookie-based auth to resolve CORS issues --done
179. Create complete user management system with admin/searcher roles and subscription tiers (standard/premium/professional) --done
180. Add automatic default admin user creation (aips@anywhere.co / aips!123) on server startup --done
181. Integrate user management UI with dark mode support and navigation between app and user management --done
182. Replace alert() security risks with secure DOM-based messaging system --done
183. Update AIPrivateSearch-User-Management-System.md with comprehensive authorization strategy documentation --done
184. Fix version display in header showing v18.01 instead of current v19.34 --done

## COMPLETED (v19.33)
175. Fix security linting errors by replacing unsafe innerHTML assignments with secure DOM methods --done
176. Create AIPrivateSearch-PaymentProcessing.md documentation for subscription tiers and SecureAccess integration --done
127. highlight matched words in all  --done
177. Integrate user management system with existing email-based user info icon and navigation --done

## COMPLETED (v19.32)
170. In AI direct responses make the file names into links as in Doc index, line and document search --done
171. Remove View Document links from AI Direct responses since filenames are now clickable --done
172. Format line numbers on separate lines in Doc Index, Line Search, and Document Search responses for better readability --done
173. Add context lines (before and after) to Document Search results for better readability --done
174. Make filename links jump to specific line numbers and highlight matched lines in document viewer --done

## COMPLETED TASKS (v01 -> v19.40)
210. create me a checklist for each role-tier for testing with each Role-tier and all menu items that should appear. --done

## COMPLETED TASKS (v01 -> v19.31)

1. Add dropdown for Model selection - done
2. sort model names and ignore nomic model in list - done
3. total to weighted score - done
4. if scoring is checked and there are no scores, redo scoring 1 time. if no scores after repo. message no scores are available - done
5. show ollama times etc at end of response  --done
6. create PcCode --done
7. gather pc mmetics, ram cpu etc --done
8. Use CreatedAt format not TimeStamp --done
9. add model options Temperature and Context Size --done
10. move Temp Cont to under Model drop down --done
11. Store the results in the MySQL db aiprivatesearch searches --done
12. add system propmts dropdown --done
13. add user prompts dropdown --done
14. Terminal interface for multiple tests? - no --done
created test-executor  --done
15. add copyright and licence and add aisearch-n-score.com  --done
16. create 41 tests - implement auto testing --done
17. menu structure?  login, update config files. home, back ground from alan --done
18. Create Family documents --done
19. collect email address and store in searches table --done
20. fix Collections !!!  --done
19.  create way to create document collections stored in sources/local documents --done
20. multiple models selection --done
21. read prompts from tables ?? mutliple selections  --done
23. Collect email and use with export & messaging --done
24. Fix config manage Cancel with no changes -- done
25. Add collections info to database -- done
26. Privacy Policy Terms of Service , Contact --done
27. add score model to db test --done
28. Toggle Developer mode -- done
29. Require email onevery page -- done
30. Move Auto export next to Geneerate Scores -- done
28. Only pull ollama if over 24 hrs old --Done
28. Add context and tokens and temperature to scores  --done
33. get the good enough score models --done
34. get best embeding technique - embed with lanceDB ?? --done
36. get the good enough search models.  --done
37. Create Doctors and lawyers document set  --done
38. processing consistent color scheme -- Done
39. secureUser  set dark mode -- done ??
40. EvalTokensperSecond-search not showing in DB  --done
41. security (code issues) --done (using ESLint)
42. Fix Show Chunks issue --done
43. Persist User Prompt  --done
44. Fix processing to disable other controls --done
45. Fix dotenv 7.2.1  --done
46. Fix close browser and terminal -- done
47. fix .env file issue --done
48. fix npm warning msgs  --done
49. test scoring --done
50. User-confirmed install Node.js in load-aiss.command --done
51. User-confirmed install Ollama in load-aiss.command --done
52. User-confirmed install Chrome browser --done
53. User-confirmed start Ollama service in start.sh --done
54. Enhanced error handling for missing dependencies --done
55. Changed from auto-install to user confirmation for all dependencies --done
56. Uncheck Search checkbox by default on model page --done
57. Add Remove Unlisted Models button to clean up models not in models-list.json --done
58. Remove :latest suffix from Ollama model names --done
59. Left align scoring table content --done
60. Fix criterion column width to fit "Weighted Score" --done
61. Rename "Remove Unused Models" to "Remove Unlisted Models" --done
62. Fix dark mode processing text to use light gray background --done
63. Fix dark mode processing button and inline elements styling --done
64. Where is the meta_collection .md file being saved?  --done
67. Load-aiss.command is not pulling latest from github using curl --done
68. analyze LanceDB vs ChromaDB stick with LanceDB --done
69. ESLint for checking commits --done
70. Add docid field to source and meta files for model correlation --done
71. Update collections-editor UI: move Embed column, exclude META files from embedding --done
72. Add "Add Meta Prompt" checkbox to search page --done
73. Create meta-prompt.json file for collection meta-prompts --done
74. Fix module import error for header/footer loading --done
75. Fix collections-editor Create Metadata and Remove Embeds buttons --done
76. Move meta-prompts.json to config directory --done
77. Replace unchecked embed badge with dash for collection meta files --done
78. colection meta file must grab certian stuff from other meta files. --done
79. Meta-prompt should be concatination of all meta files --done
80. In create metadata the docid for source does not equal docid for meta --done
81. Review processing time for create Metadata  --done
82. Test multi-mode-search --done
83. Document each mode  --done
83. evaluate the best techniques for a user  --done
84. Enhance Traditonal Text (Exact Match Search) rename and improve  --done
85. Move Document search to search page - common routine for responses. --done
86. Create common Line Search formatting routine for both search and multi-mode pages --done
87. Enhance Line Search View Document links to show line numbers and jump to match line --done
88. Add dark mode support to document viewer --done
89. Modify Document Search View Document links to work like Line Search with line numbers --done
91. Document search disability and will finds Health Care --investigated: Health Insurance.md contains "Disabled dependents covered indefinitely" which matches "disability" search  --done
92. Add fuzzy match highlighting to Document Search (highlight 'disabled' when searching 'disability') --done
93. Review show hide on search page. Is it in one function? There are problems local model only vs local documents.  -done
94. We have lost highlighting of matches in line search --done
95. line serach, document search, RAG search, ai directis missing performancce metrics and system information --done
96. after persisting temp etc. responses are not correct. are these parm being used is search?  --done
97. Changed from sqllite3 to sql.js to remove Command line tools requirement on mac. --done
98. Add version to header filee. --done
99. Check on widlcards in both line and document search  --done
100. Remove unneeded debug code.  --done
101. added commit message and auto version bump  --done
102. metadata search (document Index) - fixed to use sql.js and proper error messaging --done
103. Clean up response vews  --done
103. Change supporting files, functiond to be consistent with  titles . i.e. line search = exactMatch  --done
104. change names meta -> Index, create metadata -> create Indexes  --done
105. create user prompts based on source Type and collection and search type  --done
106. Rename RAG/RagSearch references to "AI Document Chat" for consistency --done
107. Reverted "Document Text Search" back to "Document Search" --done
108. Rename FullTextSearch class to DocumentSearch --done
109. Change all "fulltext" references to "document-search" --done
110. Change "hybrid" to "hybrid-search" for consistency --done
111. Fix multi-mode HTML container IDs for hybrid-search and document-search --done
112. Replace innerHTML with secure DOM methods to prevent XSS --done
113. Fix hybrid search endpoint URL from /hybrid to /hybrid-search --done
114. Create comprehensive user manual (AIPrivateSearch-User-Manual.md) --done
115. Change "Create Metadata" button to "Create Doc Indexes" and "Meta" badge to "Index" --done
116. Fix SearchOrchestrator metadata method calls and implement getMetadataStatus --done
117. Change user-facing "metadata" messages to "Doc Index" terminology --done
118. metadata model is not working where is model coming from.  --done
119. remove all timeouts  --done
123. We need to place source documents outside of repo. --done
130. sources for customers should not be aisns folder .. should be in uers/shared/aisns/sources  --done
132. Add to release copy the AIPrivateSearch/sources content to AIPrivateSearch/repo/aiprivatesearch/sources before release   --done
134. Fix inconsistent path construction causing "File not found" errors in document indexing --done
135. Create centralized app.json config file to eliminate hardcoded paths --done
136. Use app.json config for app-name in index.html title and heading --done
137. Refocus app from AI testing to private document search for professionals and families --done
138. Add user-friendly alerts when embeddings or doc indexes are missing with setup instructions for all search types --done
139. Create centralized SetupGuidance utility for consistent setup messaging across all search types --done
140. Change repos to repo load --done
141. exchange order coll-edit  Embed badges and index card badges --done
134. Fix convert on pdfs in Law-Office collection - PDF conversion is reading raw binary instead of using pdftotext extraction  --done
136. Fix spacebar problem --done
142. Fix document index creation failing with system-prompts.json path error --done
140. AI Document Chat responses are not formatted --done
141. Add consistency to View Document links in all searchtypes --done
143. Fix AI Document Chat single word queries failing with "embeddings required" error due to collection name case sensitivity --done
144. Render AI Document Chat responses in proper markdown format instead of raw text --done
145. Remove View Document links from AI Document Chat responses since they have source document links at bottom --done
143. Change the term "Developer" to "Professional" throughout the app in code and text --done 
144. Explain why "which patients have hypertension" finds no results in line search and doc index search - Line/Document Index searches look for exact text matches, not natural language queries. Use single words like "hypertension" or AI-based searches for natural language questions --done
145. Add phrase-to-keywords converter for Line Search and Document Index Search to extract relevant keywords from natural language queries --done
146. Add View Document links for source chunks in AI Document Chat responses --done
147. Consolidated role-related tasks into comprehensive user management system --done
148. In performance measurement make column titles sortable links. --done
149. Review doc index card creation add remove fields change models overall improve --done
150. For AI document Chat the view document link doesn't apply. Can we view source chunks? --done
151. Doc Index, Line and Document searches find matches. Only Line search does highlighting correctly. Fix highlighting of matches in response formatting. --done
152. Fix Document Index Card search highlighting by updating ExcerptFormatter to use proper search-highlight class --done
153. Create common highlighting utilities for consistent markup and rendering across all search types --done
154. Update Line Search to use common HighlightFormatter utility for consistency --done
155. Fix ES6 export syntax error in highlightRenderer.js --done
156. Fix Line Search results running together by improving line break and separator handling --done
157. Simplify Line Search formatting to match working Document Search and Document Index formatting --done
158. Create common result formatter to eliminate duplicate code across Line Search, Document Search, and Document Index Search --done
159. Fix Document Index Cards missing View Document links by updating common formatter to handle all result types --done
160. Fix Line Search View Document links failing due to source field containing line numbers (filename:123 format) --done
161. Make filenames clickable links in search result headers for direct document access --done
162. Add persistence for selected search types in multi-mode search using localStorage --done
163. Integrate sentence transformers as primary embedding method with Ollama fallback for AI Document Chat and Doc Index creation --done
164. Remove hardcoded embedding models and use dynamic lookup from models-list.json configuration --done
165. Fix JSON DocID formatting issues - JSON files now properly store DocID as JSON property instead of malformed text lines --done
166. Remove duplicate nested sources folder and verify all JSON files have correct formatting --done



