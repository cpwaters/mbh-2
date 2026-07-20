# Firebase Authentication Setup

## Enable Email/Password Authentication

To enable Email/Password authentication in your Firebase project, follow these steps:

### Option 1: Using Firebase Console (Recommended)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **mybackhaul-21112**
3. Click on **Authentication** in the left sidebar
4. Go to the **Sign-in method** tab
5. Click on **Email/Password**
6. Toggle **Enable** to ON
7. Click **Save**

### Option 2: Using Firebase CLI

Run this command to open the Firebase Console directly:

```bash
firebase open auth --project mybackhaul-21112
```

Then follow steps 4-7 from Option 1 above.

## Enable Google Sign-In (Optional)

To enable Google Sign-In:

1. In the Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google**
3. Toggle **Enable** to ON
4. Select a **Project support email** from the dropdown
5. Click **Save**

## Test Authentication

After enabling authentication, you can test it by:

1. Starting the development server:
   ```bash
   cd client && npm run dev
   ```

2. Navigate to the login page
3. Click "Sign up" to create a new account
4. Try logging in with your credentials

## Authentication Features

The application now includes:

- ✅ Email/Password registration
- ✅ Email/Password login
- ✅ Google Sign-In
- ✅ Persistent authentication state
- ✅ Protected routes
- ✅ Logout functionality
- ✅ Error handling for common Firebase auth errors

## Default Test User

You can create a test user with any valid email and password (minimum 6 characters).

Example:
- Email: `test@example.com`
- Password: `password123`
