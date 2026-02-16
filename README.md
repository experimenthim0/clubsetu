# Club Event Management System

A full-stack web application for managing club events, registrations, and user profiles. Built with the MERN stack (MongoDB, Express, React, Node.js).

## 🚀 Features

- **User Authentication**: Secure login and registration for Students and Club Heads.
- **Role-Based Access**:
  - **Students**: Browse events, register for events, view their registrations.
  - **Club Heads**: Create, edit, and manage events.
- **Event Management**:
  - Create, Read, Update, and Delete (CRUD) events.
  - View event details and manage attendee lists.
- **Responsive UI**: Modern interface built with React and Tailwind CSS.

## 🛠️ Tech Stack

### Client
- **Framework**: [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Server
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (using [Mongoose](https://mongoosejs.com/))
- **Authentication**: JWT (JSON Web Tokens) *[Implied based on typical MERN auth, adjust if specific lib seen]*
- **Environment**: [Dotenv](https://www.npmjs.com/package/dotenv)

## 📋 Prerequisites

Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance running on default port `27017`)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd club-event-main
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

**Configuration:**
The application currently connects to a local MongoDB instance at `mongodb://localhost:27017/club-event`. Ensure your local MongoDB server is running.

Start the backend server:
```bash
npm start
# OR for development with nodemon
npm run dev
```
The server will start on `http://localhost:5000` (or the port defined in your `.env`).

### 3. Frontend Setup
Open a new terminal, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 📂 Project Structure

```
club-event-main/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (Navbar, etc.)
│   │   ├── pages/          # Application pages (Login, EventFeed, etc.)
│   │   ├── assets/         # Static assets
│   │   ├── App.jsx         # Main application component with routes
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express Backend
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes (auth, events)
│   ├── index.js            # Server entry point
│   ├── connection.js       # Database connection logic
│   └── package.json
│
└── README.md
```

## 🤝 Contributing

1. Fork the repository.

5. Open a Pull Request.