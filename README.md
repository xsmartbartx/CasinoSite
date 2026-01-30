# 🎰 CasinoSite

**CasinoSite** is a GPL-3.0 licensed web application project designed as an online casino platform.  
The repository is structured for scalability and further expansion, with a clear separation between frontend and backend responsibilities.

> Status: **Work in progress**  
> License: **GNU General Public License v3.0**

---

## 📌 Project Goals

- Provide a modern web-based casino platform
- Modular architecture (frontend + backend)
- Clean separation of concerns
- Open-source and extensible

This project can serve as:
- A learning platform for full-stack development
- A base for casino-style UI/UX experiments
- A foundation for game logic, wallets, and user systems

---

## 🗂 Repository Structure

CasinoSite/
├── client/ # Frontend application
│ ├── public/ # Static files (HTML, icons, assets)
│ ├── src/ # Application source code
│ │ ├── components/ # Reusable UI components
│ │ ├── pages/ # Page-level views
│ │ ├── assets/ # Images, styles, media
│ │ └── index.* # Application entry point
│ ├── package.json # Frontend dependencies & scripts
│ └── README.md # Client-specific notes (optional)
│
├── server/ # Backend (if present / planned)
│ ├── controllers/ # Business logic
│ ├── routes/ # API routes
│ ├── config/ # Configuration files
│ └── server.js # Backend entry point
│
├── .gitignore
├── LICENSE # GPL-3.0 license
├── package.json # Root tooling (if applicable)
└── README.md # Project documentation
