# TravHub Project Scope & Architecture

## 1. Application Strategy
- **100% Progressive Web App (PWA) Focus**: We are exclusively building a PWA. We will NOT build native Android/iOS apps (no React Native, no Cordova, no Flutter).
- **Persistent Connection**: We will use WebSockets (Socket.io) to maintain a live connection for real-time updates (similar to Instagram/social feeds).

## 2. Infrastructure & Hosting
- **Database**: MongoDB (MongoDB Atlas for production).
- **Image Storage (CDN)**: Cloudinary (or Cloudflare R2). No images will be stored on the local VPS filesystem.
- **Development Routing**: Cloudflare Tunnels (`cloudflared`) will be used to route a live custom domain to the local development environment, permanently replacing Ngrok.

## 3. Project Structure (3-Part System)
The system is divided into three distinct frontends connected to a single API backend:
1. **Landing Page (`main domain`)**: Marketing, SEO, and user signup.
2. **User PWA (`app.domain.com`)**: The live, interactive application for customers.
3. **Admin PWA (`admin.domain.com`)**: The control panel and dashboard for staff/management.
4. **Backend API (`api.domain.com`)**: Node.js/Express server providing data via REST APIs and WebSockets to all three frontends.

## 4. Frontend Architecture
- **Framework**: React / Next.js
- **Design Pattern**: Feature-based folder structure.
- **State/API Management**: Axios & React Query for centralized API interactions.

## 5. Backend Architecture (Clean / Layered)
- **Routes**: Define HTTP endpoints.
- **Controllers**: Handle HTTP request/response flow.
- **Services**: Contain business logic.
- **Models**: MongoDB schema definitions.

## 6. Push Notifications
- **Service**: Firebase Cloud Messaging (FCM) will be used to deliver native Web Push Notifications to the PWA on user devices.

## 7. Eliminated Ideas (Do Not Revisit)
- Mobile App Wrappers (React Native, Expo, Capacitor).
- Local VPS file system uploads (Multer saving to disk).
- Hardcoded URLs (everything must use `.env` files).
- Ngrok (replaced by Cloudflare Tunnels).
