# 🩺 HealthXpert — AI-Powered Healthcare Platform

HealthXpert is an **AI-driven healthcare platform** that empowers patients to describe symptoms, receive AI-assisted triage and disease predictions, and securely connect with doctors for consultations and chat.  
Built with **Flask (backend)** and **React + TypeScript (frontend)**, it integrates **JWT authentication** and **SQLAlchemy** for robust, secure operations.

---

## 🚀 Key Highlights

- 🧠 **AI Symptom Analysis** — Get intelligent disease predictions using the SambaNova client.  
- 👩‍⚕️ **Patient & Doctor Dashboards** — Role-based access for efficient user experience.  
- 💬 **Consultation Lifecycle** — Create, assign, and manage consultations with real-time status updates.  
- 🔐 **Secure Chat** — Doctor–patient chat linked to each consultation.  
- 📄 **Document Uploads** — Supports medical reports up to **16 MB**.  
- 🔑 **JWT Authentication** — Token-based secure login and profile endpoints.  
- 📱 **Responsive UI** — Built with Material UI for seamless performance across devices.  
- 🗄️ **Database Flexibility** — Supports **MySQL** (default) and **SQLite**.  

---

## 🧰 Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React, TypeScript, Axios, React Router, Material UI |
| **Backend** | Flask, Flask-JWT-Extended, Flask-CORS, SQLAlchemy, Marshmallow |
| **Database** | MySQL / SQLite |
| **AI Engine** | SambaNova Client (`backend/utils/sambanova_client.py`) |
| **Authentication** | JWT (Bearer Tokens) |
| **Storage** | Local Uploads (`backend/uploads`) |

---

## 📁 Project Structure

```
HealthXpert/
├── backend/
│   ├── app.py
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── uploads/
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── assets/
└── README.md
```

---

## ⚙️ Setup & Installation

### 🔧 Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
flask run
```

### 🌐 Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 🧩 Environment Variables
Create a `.env` file in both frontend and backend directories with required credentials:
```bash
# Backend (.env)
DATABASE_URL=mysql://user:password@localhost/healthxpert
JWT_SECRET_KEY=your_jwt_secret
AI_API_KEY=your_sambanova_api_key
```

---

## 🧪 Features in Action

| Feature | Description |
|----------|--------------|
| **Symptom Entry** | Users describe symptoms to receive AI triage and prediction. |
| **Doctor Dashboard** | Manage assigned consultations and communicate securely. |
| **Upload Reports** | Patients can attach medical documents for review. |
| **Chat System** | Real-time messaging between patient and doctor. |

---

## 🔮 Future Enhancements

- 📊 Integration with wearable health data (Fitbit, Apple Health)
- 🤖 Advanced LLM-driven medical assistance
- 🌍 Multi-language support
- 🧾 Prescription and billing module

---

## 👨‍💻 Contributors

- [Aaditya Goshike](https://www.linkedin.com/in/goshikeaaditya15)
- [Jinka Harshavardhan](https://www.linkedin.com/in/jinka-harsha-vardhan-168a85284/)
- [Gattupally Sriteja](https://www.linkedin.com/in/sriteja-gattupally-0a18b2255/)

## 📜 License (MIT)

```
MIT License

Copyright (c) 2025 Aaditya G.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🏷️ Badges

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-Backend-black.svg)
![React](https://img.shields.io/badge/React-Frontend-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

> 💡 *HealthXpert combines the precision of AI with the empathy of real doctors — building the future of digital healthcare.*
