# Regulation-Searching Frontend

Static frontend for Regulation-Searching system, built with HTML5 + Tailwind CSS + Vanilla JavaScript.

## Features

- **Modern UI**: Clean and professional design with light/dark theme support
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Multi-user System**: Role-based access control (Admin & Employee)
- **AI Chat Interface**: Based on Figma design with real-time messaging
- **Admin Dashboard**: Knowledge base management and system monitoring
- **Static Deployment**: Can be deployed to any static hosting service

## Project Structure

```
frontend/
├── index.html          # Login/Register page
├── pages/
│   ├── chat.html      # Employee AI chat interface
│   └── admin.html     # Admin dashboard
├── js/
│   ├── config.js      # API configuration and utilities
│   ├── auth.js        # Authentication logic
│   ├── theme.js       # Theme management
│   ├── chat.js        # Chat page logic
│   └── admin.js       # Admin page logic
├── css/
│   └── main.css       # Custom styles
└── assets/            # Images and other assets
```

## Quick Start

### 1. Configure Backend URL

Edit `js/config.js` and update the `BASE_URL`:

```javascript
const API_CONFIG = {
    BASE_URL: 'http://your-backend-server:8000',  // Change this
    // ...
};
```

### 2. Deploy

#### Option 1: Local Development

Simply open `index.html` in a web browser. However, due to CORS restrictions, you may need to use a local server:

```bash
# Using Python
cd frontend
python -m http.server 8080

# Or using Node.js
npx serve
```

Then visit `http://localhost:8080`

#### Option 2: Deploy to Static Hosting

You can deploy to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `frontend` folder
- **GitHub Pages**: Push to a GitHub repository and enable Pages
- **Nginx**: Copy files to `/var/www/html/`

### 3. Configure CORS

Make sure your backend allows requests from your frontend domain. Update `CORS_ORIGINS` in backend `.env`:

```env
CORS_ORIGINS=http://localhost:8080,https://your-frontend-domain.com
```

## User Roles

### Employee (员工)
- Access AI chat interface
- View conversation history
- Ask questions about regulations

### Admin (管理员)
- All employee permissions
- Access admin dashboard
- Upload and manage documents
- View system statistics
- Monitor system activity

## Theme Support

The application supports both light and dark themes:

- **Default**: Light theme
- **Toggle**: Click the theme button in the top-right corner
- **Persistence**: Theme preference is saved in localStorage

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## API Integration

The frontend communicates with the backend via REST API:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Chat
- `POST /api/chat` - Send message and get AI response
- `GET /api/conversations` - Get conversation list
- `GET /api/conversations/{id}/messages` - Get messages
- `DELETE /api/conversations/{id}` - Delete conversation

### Knowledge Base (Admin only)
- `POST /api/knowledge/upload` - Upload document
- `GET /api/knowledge/documents` - Get document list
- `GET /api/knowledge/stats` - Get statistics

## Customization

### Colors

Edit the Tailwind config in each HTML file:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: {
                    // Customize primary color
                }
            }
        }
    }
}
```

### Fonts

The project uses:
- **English**: Nunito
- **Chinese**: Noto Sans SC

To change fonts, update the Google Fonts import in HTML files.

### Logo

Replace the SVG logo in the HTML files with your own logo image.

## Security Notes

1. **HTTPS**: Always use HTTPS in production
2. **Token Storage**: JWT tokens are stored in localStorage
3. **CORS**: Configure backend CORS properly
4. **Input Validation**: All user inputs are escaped to prevent XSS

## Troubleshooting

### Cannot connect to backend

- Check if backend is running
- Verify `BASE_URL` in `config.js`
- Check browser console for CORS errors
- Ensure backend CORS settings include your frontend URL

### Login fails

- Check username and password
- Verify backend is accessible
- Check browser console for errors

### Theme not working

- Clear browser cache
- Check if JavaScript is enabled
- Verify theme.js is loaded

## Development

### Adding New Features

1. Create new HTML page in `pages/`
2. Create corresponding JS file in `js/`
3. Add navigation in sidebar
4. Update API calls in `config.js` if needed

### Debugging

Use browser DevTools:
- Console: View errors and logs
- Network: Monitor API requests
- Application: Check localStorage

## Production Checklist

- [ ] Update `BASE_URL` to production backend
- [ ] Enable HTTPS
- [ ] Configure backend CORS
- [ ] Test all features
- [ ] Optimize images
- [ ] Enable caching
- [ ] Set up monitoring

## License

MIT License

