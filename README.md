# chat2bot

## Project Description

chat2bot is an advanced chatbot application built using LangChain. It features both short-term and long-term memory capabilities, enabling it to provide context-aware and intelligent responses. The chatbot is designed to simulate human-like conversations and retain information for enhanced user interactions. The project is divided into two main parts:

- **Frontend**: Developed using TypeScript and React, providing an interactive and user-friendly interface.
- **Backend**: Built with Node.js, Express, and TypeScript, handling the chatbot's logic, memory management, and API endpoints.

## Features

- **Short-term Memory**: Retains context during a single conversation session.
- **Long-term Memory**: Stores information across sessions for a more personalized experience.
- **LangChain Integration**: Utilizes LangChain for advanced natural language processing capabilities.

## Installation Guide

Follow these steps to set up and run the project locally:

### Prerequisites

Ensure you have the following installed on your system:

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn
- A modern browser (e.g., Chrome, Firefox)

### Backend Setup

1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   tsc && node dist/server.js
   ```

   The backend server will start, and you can access it at `http://localhost:3001` (or the port specified in the configuration).

### Frontend Setup

1. Navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend application will start, and you can access it at `http://localhost:5173` (or the port specified in the configuration).

### Running the Full Application

1. Ensure both the backend and frontend servers are running.
2. Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
3. Interact with the chatbot and explore its memory features.