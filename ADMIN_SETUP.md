# Admin Portal Setup

The admin portal is now password-protected. Only users with admin privileges can access it.

## How to Set Up Admin Users

You have **two options** to make a user an admin:

### Option 1: Using Environment Variable (Recommended for Production)

Set the `ADMIN_EMAILS` environment variable with comma-separated email addresses:

```bash
export ADMIN_EMAILS="your-email@example.com,admin@example.com"
```

Or in Railway, add it as an environment variable:
- Go to your Railway project → Variables
- Add: `ADMIN_EMAILS` = `your-email@example.com`

When users with these emails sign up or log in, they will automatically be granted admin access.

### Option 2: Manual Edit (For Development)

1. Stop the server
2. Edit `data/users.json`
3. Find the user object you want to make admin
4. Add `"isAdmin": true` to that user object:

```json
{
  "users": [
    {
      "id": "1234567890",
      "username": "yourname",
      "email": "your-email@example.com",
      "password": "...",
      "isAdmin": true,
      "createdAt": "..."
    }
  ]
}
```

5. Restart the server
6. Log out and log back in for the change to take effect

## Testing

- Regular users: Will see "Access denied" if they try to access `/admin`
- Admin users: Will see the "🔐 Admin Portal" link in the header and can access all admin features
- The admin link only appears for admin users in the main app header

## Notes

- Admin status is checked on every request to the admin portal
- If you're already logged in, you may need to log out and log back in after granting admin privileges
- The `isAdmin` flag in the user data takes precedence over the `ADMIN_EMAILS` environment variable
