# PokerNowAI - Poker Session Analysis Tool

A comprehensive tool for analyzing your poker sessions and gaining insights into your gameplay using AI-powered analytics.

## Features

- **Session Tracking**: Record your poker sessions and track performance over time
- **Bankroll Management**: Monitor your bankroll with customizable metrics
- **Hand History Analysis**: Upload your PokerNow.club log files for detailed hand history analysis
- **Python-Powered Analytics**: Process log files with advanced Python algorithms for deeper insights
- **Performance Visualization**: View your performance trends with interactive charts

## Project Structure

The project consists of two main components:

1. **React Frontend** - The user interface for the application
2. **Express Backend** - API server for data storage and basic processing
3. **Python Analytics Backend** - Specialized service for advanced poker log analysis

## Setup and Installation

### Frontend and Express Backend

1. Clone the repository
```bash
git clone https://github.com/yourusername/pokernowai.git
cd pokernowai
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. The application will be available at `http://localhost:3000`

### Python Analytics Backend

The Python backend is designed to be deployed on PythonAnywhere, a cloud platform for hosting Python applications.

1. Navigate to the python_backend directory
```bash
cd python_backend
```

2. Follow the deployment instructions in `python_backend/README.md` to set up the Python service on PythonAnywhere

## Features in Detail

### Poker Log Analysis

Upload your PokerNow.club log files to get detailed insights:

- Hand-by-hand analysis
- Position-based statistics (VPIP, PFR, win rates)
- Profit/loss tracking by position and game phase
- Identification of leaks in your gameplay

### Bankroll Management

- Track your poker bankroll across all games
- Record and categorize each session
- Visualize performance over time
- Calculate key metrics like ROI and session profitability

## Technology Stack

- **Frontend**: React, TailwindCSS, DaisyUI
- **State Management**: React Context API
- **Backend**: Express.js, MongoDB
- **Authentication**: Firebase Auth
- **Analytics Backend**: Flask, Pandas, NumPy
- **Hosting**: Vercel (Frontend/Express), PythonAnywhere (Python Analytics)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
PYTHON_API_URL=your_pythonanywhere_api_url
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.