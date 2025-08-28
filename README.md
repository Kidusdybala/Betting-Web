# Ethio Bet- Ethiopian Football Betting Web Application

A full-stack football betting application built with React, TypeScript, Node.js, Express, and SQLite. Features real-time odds, secure authentication, and Ethiopian payment integration.

## 🚀 Features

### ✅ Completed Features
- **User Authentication**: Secure login/register with JWT tokens
- **Real-time Matches**: Live football matches with real-time odds
- **Betting System**: Place bets on match outcomes (home/draw/away)
- **User Dashboard**: Comprehensive betting dashboard with statistics
- **Profile Management**: Update user information and view transaction history
- **Bet Slip**: Interactive betting interface with real-time calculations
- **Payment Integration**: Deposit/withdrawal system with Ethiopian payment methods
- **Admin Panel**: Match and odds management (backend ready)
- **Real-time Updates**: WebSocket integration for live match updates
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

### 🔧 Technical Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript, SQLite, Socket.io
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: SQLite with foreign key constraints and indexing
- **Real-time**: Socket.io for live updates
- **State Management**: React Context API

## 📁 Project Structure

```
betting-web/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Authentication & validation
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Database utilities
│   │   └── db/             # Database schema & initialization
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Utilities and API client
│   │   └── hooks/          # Custom React hooks
│   ├── package.json
│   └── vite.config.ts
├── start.bat               # Windows startup script
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### Backend Setup
```bash
cd backend
npm install
npm run build
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Environment Configuration

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
SQLITE_DB_PATH=c:\Users\user\Documents\Betting web\backend\data\app.db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

## 🚀 Running the Application

### Quick Start (Windows)
Double-click `start.bat` or run:
```bash
./start.bat
```

### Manual Start

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/health

## 📊 Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and balances
- `matches` - Football matches with scores and status
- `odds` - Betting odds for each match
- `bets` - User bets with stake and potential winnings
- `transactions` - Financial transactions (deposits/withdrawals)

## 🔐 Authentication

The app uses JWT-based authentication:
- Register new users with email/password
- Secure login with password hashing
- Protected routes with middleware
- Token refresh functionality

## 💰 Betting System

### How to Place Bets
1. Browse live/upcoming matches
2. Click on odds buttons (1/X/2) to add to bet slip
3. Set stake amount in the bet slip
4. Review potential winnings
5. Place bet (requires authentication)

### Bet Types
- **Home Win (1)**: Bet on home team victory
- **Draw (X)**: Bet on match ending in draw
- **Away Win (2)**: Bet on away team victory

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Matches
- `GET /api/matches` - Get all matches
- `GET /api/matches/live` - Get live matches
- `GET /api/matches/upcoming` - Get upcoming matches

### Betting
- `POST /api/bets` - Place a new bet
- `GET /api/bets/my-bets` - Get user's bets
- `PATCH /api/bets/:id/cancel` - Cancel a bet

### Payments
- `POST /api/payments/deposit` - Deposit money
- `POST /api/payments/withdraw` - Withdraw money
- `GET /api/payments/history` - Transaction history

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm run dev      # Start development server with nodemon
npm run build    # Build TypeScript to JavaScript
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run Jest tests
```

#### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Comprehensive error handling

## 🚀 Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Start the server: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your web server
3. Configure API URL environment variable

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions:
- Check the API health endpoint: `/health`
- Review server logs for errors
- Ensure all environment variables are set correctly

## 🎉 What's Next

Future enhancements could include:
- Real sports data API integration
- Advanced betting markets (over/under, handicaps)
- Live match commentary
- Push notifications
- Advanced analytics dashboard
- Mobile app development
- Multi-language support

---

**Ethio Bet
** - Experience the thrill of Ethiopian football betting! ⚽💰
