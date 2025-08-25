```markdown
# Development Plan for Abhaya News & Video Mobile App

This plan outlines the step-by-step changes needed across three major components—Mobile App (React Native), Backend Services (Node.js/Express/MongoDB), and Admin CMS (Next.js)—including error handling, UI/UX best practices, and integration points.

---

## 1. Project Structure & Setup

- **Directory Organization:**
  - Create three main directories:
    - `mobile-app/` – Contains the React Native project.
    - `backend/` – Contains Node.js/Express code.
    - Existing Next.js project in `src/` (enhanced with admin pages under `src/app/admin/`).

- **Configuration Files:**
  - Update `package.json` (root) to include new dependencies for backend (express, mongoose) and mobile (react-native, react-navigation) when initializing those projects.
  - Adjust ESLint and TSConfig files (e.g., `tsconfig.json`, `eslint.config.mjs`) to include new folders if necessary.

---

## 2. Mobile App (React Native)

### 2.1. Core Files & Screens

- **mobile-app/App.tsx**
  - Set up React Navigation (stack/tab navigators).
  - Wrap the navigator in an error boundary component.
  - Define a development flag to use mock API endpoints initially.

- **mobile-app/screens/SplashScreen.tsx**
  - Create a splash screen with a central logo image:
    ```tsx
    <Image
      source={{ uri: "https://placehold.co/300x300?text=Abhaya+News+Mobile+Logo" }}
      alt="High-resolution placeholder image of Abhaya News logo centered on a clean background"
      onError={(e) => console.warn("Image load failed", e)}
      style={{ width: 300, height: 300 }}
    />
    ```
- **mobile-app/screens/OnboardingScreen.tsx**
  - Implement a carousel of slides (using FlatList or ScrollView).
  - Each slide explains app features (news, videos, bookmarks) with descriptive texts and a “Skip” button.
  - Ensure smooth transitions and responsive layout.

- **mobile-app/screens/LoginScreen.tsx**
  - Provide forms for Email, Phone OTP, Google sign-in, and Guest mode.
  - Use form validation and display inline error messages.
  - Error handling: Catch authentication API errors and display alerts.

- **mobile-app/screens/HomeFeed.tsx**
  - Display two tabs: one for News and one for Videos.
  - Render list items as cards (use a custom Card component) with headline, summary, and a placeholder image:
    ```tsx
    <Image
      source={{ uri: "https://placehold.co/400x300?text=News+Card+Image" }}
      alt="Professional image placeholder for news card with clean typography"
      onError={(e) => console.warn("Image load failed", e)}
      style={{ width: 400, height: 300 }}
    />
    ```
  - Implement pull-to-refresh and error fallback (e.g., “No content available”).

- **mobile-app/screens/NewsDetail.tsx & VideoDetail.tsx**
  - **NewsDetail.tsx:** Render full article content, images (with placeholders), related news section, and adjustable font-size controls (buttons or slider).
  - **VideoDetail.tsx:** Embed a YouTube player using WebView. Provide share options (copy link, direct share via OS share menu).

- **mobile-app/screens/BookmarksScreen.tsx, SearchScreen.tsx, & SettingsScreen.tsx**
  - **BookmarksScreen:** List saved articles/videos with options to remove bookmarks.
  - **SearchScreen:** Implement a search input with autocomplete suggestions (mock data initially) and display trending content.
  - **SettingsScreen:** Allow users to change language, toggle dark/light mode, and adjust font size. Use a clean, modern layout with ample spacing.

### 2.2. Error & Offline Handling
- Use try-catch blocks for API/data fetch calls.
- For offline support, integrate AsyncStorage to cache up to 20 latest articles/videos.
- Display user-friendly error messages and retry options when network operations fail.

---

## 3. Backend Services (Node.js/Express/MongoDB)

### 3.1. Server Setup

- **backend/server.js**
  - Initialize an Express server; include middleware for JSON parsing, CORS, and HTTPS redirection.
  - Connect to MongoDB using Mongoose. Wrap connection logic in try-catch to log connection errors.
  - Add a global error handler to catch unhandled exceptions and send structured error responses.

### 3.2. API Routes & Controllers

- **backend/routes/auth.js**
  - Implement user login, signup, phone OTP validation endpoints.
  - Validate inputs and return HTTP error codes on validation failures.

- **backend/routes/news.js & backend/routes/videos.js**
  - Create CRUD REST endpoints for news articles and video entries.
  - In `news.js`: Add routes for GET (list, single news), POST, PUT, DELETE.
  - In `videos.js`: Ensure endpoints accept YouTube links; add a controller to auto-fetch thumbnail (mock initial implementation).
  - In controllers, wrap async calls in try-catch and return JSON error messages with appropriate status codes.

### 3.3. Additional Integrations

- Set up a configuration file (e.g., `backend/config.js`) to manage environment variables for MongoDB connection, port, etc.
- Use Firebase Admin SDK (optional initially) for future integration with FCM notifications.

---

## 4. Admin CMS (Next.js)

### 4.1. New Admin Pages

- **src/app/admin/login.tsx**
  - Create a secure login form exclusively for admins.
  - Use controlled input elements with proper error messages on invalid credentials.

- **src/app/admin/dashboard.tsx**
  - Build a dashboard displaying recent news/videos and basic statistics (views, shares).
  - Use a grid layout with clear headings, using modern typography and sufficient white space.
  - Employ placeholders for charts using the existing `src/components/ui/chart.tsx` component or a simple div layout with textual analytics.

- **src/app/admin/news.tsx & src/app/admin/add-news.tsx**
  - **news.tsx:** List all news articles with options to add, edit, or delete.
  - **add-news.tsx:** Implement a form to create or update news: include fields for title, summary, content, category, and image upload. Validate each field and handle file upload errors (display fallback placeholder if image fails to load).

- **src/app/admin/videos.tsx & src/app/admin/add-video.tsx**
  - **videos.tsx:** Display a list of video entries, with edit and delete options.
  - **add-video.tsx:** Provide a form to accept a YouTube URL. Auto-fetch (or mock) the video thumbnail and display a preview using a placeholder image if necessary.

### 4.2. Global Styling & Reusable Components

- Update **src/app/globals.css** to set common variables for themes (light/dark), font sizes, and spacing.
- Reuse and extend UI components in `src/components/ui/` for buttons, forms, dialogs, etc., to maintain consistency.
- Ensure all images use placeholders only when necessary (e.g., when no image exists) following the format:
  ```html
  <img src="https://placehold.co/1920x1080?text=Bright+modern+studio+apartment+with+city+views" alt="Bright modern studio apartment with city views" onerror="this.onerror=null; this.src='fallback_url';">
  ```

### 4.3. API Integration & Error Handling

- In admin pages, use Axios or Fetch to call backend API endpoints.
- Store API base URL and keys (if any) in a central config file (e.g., `src/lib/utils.ts`).
- Validate responses and display error messages using alert dialogs or inline notification components.
- Use try-catch blocks around API calls and display fallback content if endpoints are unreachable.

---

## 5. Testing & Deployment

- **Backend Testing:**
  - Use `curl` commands to test all API endpoints (authentication, CRUD for news and videos) and validate error codes.
  - Example:
    ```bash
    curl -X GET http://localhost:5000/api/news -H "Content-Type: application/json"
    ```
- **Mobile App Testing:**
  - Run the mobile app with Expo or React Native CLI. Verify each screen (onboarding, login, feeds) renders correctly, and simulate error states.
- **Admin CMS Testing:**
  - Start Next.js in development mode (`npm run dev`) and verify all admin pages render, load data, and handle error states.
- Update the **README.md** with instructions for each component’s setup, testing, and deployment.
- Ensure HTTPS is enforced for API calls and that environment variables (e.g., MongoDB URI, Firebase config) are securely managed in production.

---

## Summary

- Organized project into three components: Mobile App, Backend Services, and Admin CMS with clear directory separation.
- Mobile App includes modern screens (Splash, Onboarding, Home Feed, Detail pages, Bookmarks, Search, Settings) and robust error/offline handling.
- Backend uses Express with MongoDB for secure, validated CRUD operations and proper API error management.
- Admin CMS in Next.js introduces secure login, dashboard, and CRUD forms for news and videos, leveraging reusable UI components and global styles.
- All new images use descriptive placeholder URLs with alt text and graceful fallback handlers.
- Comprehensive testing via curl commands and local development environments ensures reliability.
- The plan details UI/UX considerations with modern typography, spacing, and clean layouts for a professional, user-friendly experience.
