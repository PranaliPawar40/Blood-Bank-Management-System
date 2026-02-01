🩸 Blood Bank Management System

This is a web-based Blood Bank Management System developed to manage blood donor information and help users find suitable donors easily. The system allows donors to register their details and users to search donors based on blood group and location. It follows a role-based approach where different users see different options after login. The project is built using Node.js, Express.js, EJS, and MySQL, with session-based authentication to ensure secure access. The application provides a simple and user-friendly interface for efficient donor management and searching.


🛠️ Technologies Used

Frontend: HTML, CSS, Bootstrap, EJS (Embedded JavaScript Templates)
Backend: Node.js, Express.js
Database: MySQL
Authentication: Session-based authentication


🔐 Security Implementation

Session-based authentication to protect routes.
Role validation on backend to prevent unauthorized access.
Sensitive configuration details stored securely in environment variables.
Frontend role-based rendering for improved user experience.


📂 Project Structure Overview

Views (EJS):
Home, Login, Dashboard
Donor Registration Form
Search Donor Page
Donor List Page
Admin Dashboard

Partials:
Header, Navbar, Footer for reusable UI components

Environment Configuration:
.env file used to store database credentials and server configuration
