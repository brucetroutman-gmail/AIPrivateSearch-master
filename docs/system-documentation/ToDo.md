to do AIPrivateSearch

## PENDING TASKS

### Immediate Priority (Next Sprint)
2-001. Connect login and tier checking via license check system - currently disabled for testing, need to obtain tier level from license check after testing completion --completed
2-002. Test Login and roles - srch-std gets wrong menus after login, fix role-based menu display --completed
2-003. Update MySQL table searches with new column SearchMethodType - ensure code reflects this column and number of columns match --not needed
2-004. Test multi search and view documents functionality
2-005. Test multi prompts and ASCII characters handling
2-041. Remove Database from Export Download on search page , return to export--completed
2-042. Test Search page: document view is not working --completed
2-044. Collect public IP address during device registration using npm public-ip package and store in custmgr database --completed

### Core System Improvements
2-006. Fix Smart Search to return only matches (currently returns both matches and non-matches)
2-007. Make Response matches and View Document consistent across all types, add View Index Card to Doc Index Cards response
2-008. Create testCodes for DocumentSearch performance optimization
2-009. Review chunking strategy - analyze chunk size for small and large documents (many documents are only 2 chunks), evaluate pros and cons of changing chunk sizes
2-010. Enhance database saving to add documents only

### User Experience & Interface
2-011. Create comprehensive quick start video
2-012. Focus on display and layout improvements
2-013. Create mobile-responsive design improvements
2-014. Add keyboard shortcuts for power users
2-015. Create user onboarding tutorial/wizard
2-016. Implement search history and saved searches functionality
2-017. Add bulk document upload with progress indicators
2-018. Implement document preview without full download

### Search & AI Enhancements
2-019. Create user and system prompts by source type
2-020. Create user prompts based on source type, collection, and search type
2-021. Review processing of each search type - create 3 prompts for sourcetype, collection, searchtype and store prompts in .json configs
2-022. Implement search performance optimization and caching
2-023. Create API documentation for potential integrations
2-045. Upgrade RAG system from Level 2 to Level 4: Implement hybrid search (semantic + BM25 keyword matching with alpha tuning), add cross-encoder reranking to improve "correct chunk in top 3" from ~68% to ~89%, and add confidence scoring for production reliability. Priority: Reranking first (biggest accuracy gain), then hybrid search, then confidence thresholds.

### Analytics & Monitoring
2-024. Create admin dashboard with usage analytics
2-025. Implement usage analytics and telemetry (privacy-compliant)
2-026. Implement search result export (PDF/CSV) functionality
2-027. Implement backup/restore functionality for user data and collections

### Business & Deployment
2-028. Create marketing website/landing page for AIPrivateSearch
2-029. Create professional product screenshots and demo videos
2-030. Develop pricing strategy and subscription management system
2-031. Create installer packages for easy deployment
2-032. Implement license key management system
2-033. Develop customer support system and documentation
2-034. What changes to load aips.command if repo is made private?

### Advanced Features
2-035. Create Electron app for local macOS deployment
2-036. Create app for load-AIPrivateSearch-xxxx.command

### Compliance & Legal
2-037. Create HIPAA compliance documentation and certification
2-038. Create competitive analysis and positioning documents
2-039. Develop partner program for resellers (medical/legal consultants)
2-040. Create case studies for medical practices and law firms

=======================================================

## RECENTLY COMPLETED (v20.06)
384. Fixed tier-based menu access system across all navigation pages: Added license checker to all main pages (test.html, analyze-tests.html, multi-mode-search.html, collections.html, model.html, config.html, testcode-checker.html, search-logs.html, options.html) to ensure tier access manager correctly detects user tiers. Fixed issue where Professional tier users lost Test/Analyze menu visibility when navigating between pages. Enhanced user-management page by changing "Go to Search" button to "Go to Application" linking to index.html for better user flow. --done

=======================================================

## RECENTLY COMPLETED (v20.05)
383. Implemented public IP address collection during device registration: Added npm public-ip package to collect external IP addresses during device activation. Updated device licensing system to capture and store public IP addresses in custmgr database ip_address field alongside PC codes. Removed local IP collection to focus only on public internet-facing addresses for better device tracking and analytics. System now captures both PC code (format: C02D6R) and public IP during registration with clean error handling. --done

=======================================================

## RECENTLY COMPLETED (v20.04)
382. Implemented persistent device-based licensing with email storage: Fixed device licensing to work across system restarts by storing customerEmail in app.json configuration. Device UUID now uses platform UUID + serial number for consistent identification. License validation automatically uses stored email after device activation, eliminating need for repeated authentication. System properly detects when device activation is required based on customerEmail presence in configuration. --done

=======================================================

## RECENTLY COMPLETED (v20.02)
381. Optimized system profiler performance and consolidated device identification: Replaced slow system_profiler calls (10+ seconds) with fast sysctl and ioreg commands (0.006s). Created unified PC code generation using first 3 + last 3 digits of Mac serial number (e.g., C02D6R). Consolidated systemInfo.mjs functionality into DeviceLicenseClient, eliminating redundant code and ensuring consistent device identification across all system info requests. Fixed module import errors in search routes. --done

=======================================================

## RECENTLY COMPLETED (v20.01)
380. Implemented fail-fast configuration system and removed all fallback behaviors: Created config-error.html for missing app.json with clear error messaging. Removed all hardcoded defaults from API URLs, server configuration methods, subscription manager, and model configurations. System now enforces proper configuration files and shows specific errors when required settings are missing, eliminating dangerous silent failures that could cause port mismatches or security issues. --done

=======================================================

## RECENTLY COMPLETED (v20.00)
379. Fixed authentication issues and session timeout configuration: Resolved "not licensed" app status by identifying expired sessions due to short 5-minute timeout. Increased session timeout from 300 seconds to 3600 seconds (1 hour) in app.json bearer-token-timeout setting. Created valid session with proper localStorage setup for seamless user authentication flow. --done

=======================================================

## RECENTLY COMPLETED (v19.99)
378. Fixed role-based menu display and database connections: Resolved srch-std user getting wrong menus after login by ensuring proper user role storage in localStorage during authentication. Updated all database connections to use ../.env-aips with correct credentials (aips-readwrite) instead of hardcoded root connections. Removed member-resume.mjs and all references, replacing with group-member-profile.html. Successfully tested database connectivity with MySQL at 92.112.184.206. --done

=======================================================

## RECENTLY COMPLETED (v19.98)
377. Enhanced license activation page and updated member endpoints: Changed title to "Device Activation Required", removed system info section and Create Customer License button, added customer registration link. Updated all member profile endpoints from api2/members to api2/member-resume for consistency. Removed debugging console output from user flow for cleaner production experience. --done

=======================================================

## RECENTLY COMPLETED (v19.97)
376. Fixed redirect loop between index and user-management pages: Resolved infinite redirect loop by implementing proper authentication flow - index page checks auth first then device registration, user-management shows dashboard instead of redirecting back. Added logic to hide "Get Started" button for authenticated users while preserving access to landing page content including "Watch Videos". --done

=======================================================

## RECENTLY COMPLETED (v19.96)
372. Added member-resume.mjs endpoint for footer team member display: Created database-driven member information system with MySQL integration, proper route registration, and test infrastructure for displaying AIPrivateSearch Group member details. --done
373. Fixed MySQL database connection issues: Resolved .env file conflicts, updated start script to use .env-aips, installed mysql2 dependency, and corrected database credentials for member data access. --done
374. Formatted MySQL uninstall/reinstall documentation: Converted poorly formatted text into proper markdown with clear headers, code blocks, and improved readability for system maintenance procedures. --done

=======================================================

## RECENTLY COMPLETED (v19.95)
368. Implemented device-based licensing system: Replaced JWT token-based licensing with device UUID + email validation system, eliminating JWT expiration issues and activation loops. Created DeviceLicenseClient, device registration endpoints, and seamless auto-login flow after device activation. --done
369. Fixed JWT token expiration activation loops: Solved the core issue where users got stuck in activation cycles due to expired JWT tokens by implementing a token-free device registration system that never expires. --done
370. Enhanced license activation user experience: Added auto-fill credentials after device registration, improved error handling, and created clean localStorage management tools for testing. --done
371. Created localStorage cleaning utilities: Added clear-storage.sh script for easy testing environment reset and localStorage management during development. --done

=======================================================

## RECENTLY COMPLETED (v19.94)
367. Added create-and-login-admin endpoint: Completed the license activation auto-login flow by adding the missing API endpoint that creates admin account and returns session for seamless user experience after license activation. --done
366. Implemented admin account auto-creation after license activation: Changed strategy from preserving admin accounts during clean installs to creating admin account automatically after successful license activation with auto-login, eliminating login failures and providing seamless user experience. --done

=======================================================

## RECENTLY COMPLETED (v19.90)
364. Hide main menu and user info on index page when not licensed/registered - menu now only shows after successful license activation and login, providing cleaner experience for new users. --done

=======================================================

## RECENTLY COMPLETED (v19.88)
362. Enhanced user management system with comprehensive authentication flow, role-based access control, and secure session management. Implemented complete user registration, login, logout functionality with proper error handling and user feedback. --done

================================ to user-management.html login process with detailed console logging, auth status tracking, and debug buttons to troubleshoot post-registration login failures. --done

=======================================================

## RECENTLY COMPLETED (v19.90)
364. Hide main menu and user info on index page when not licensed/registered - menu now only shows after successful license activation and login, providing cleaner experience for new users. --done

=======================================================

## RECENTLY COMPLETED (v19.89)
362. Fix clean test installer to preserve admin account (adm-std@a.com) while clearing other test data to prevent activation loop issues after device registration. --done

=======================================================

## RECENTLY COMPLETED (v19.88)
361. Create clean test installer and selective browser clearing: Enhanced load command to clear only AIPS-related data while preserving other browser data. Added automated browser cache clearing via AppleScript and manual selective clearing scripts. --done

=======================================================

