# Backend Application for URL Shortening and analytics

# live link of Project ( hosted on Render ) : 
https://url-shortner-ggh2.onrender.com/api/login

# API Documentation (Swagger):
https://url-shortner-ggh2.onrender.com/api-docs/

# Overview
This is the backend service for a URL shortening and analytics application. 
The API allows users to shorten URLs and retrieve analytics data such as total clicks, unique users, and other related statistics. 
This service is built using **Node.js**, **Express**, and **MongoDB**.


## How to Run the Project:
Clone the repository:git clone https://github.com/hareeshtj96/Url-Shortner.git

Navigate to the project directory: 
cd Alter Office

Install dependencies:
npm install

Run the backend: npm start


# Features Implemented
User Login using Google Auth
URL Shortening: Shortens long URLs and generates unique aliases for easy sharing.
Analytics for Shortened URLs: Tracks total clicks, unique users, clicks by date, and device/OS usage for each shortened URL.
Topic-Based Analytics: Provides analytics for specific topics, including total clicks, unique users, and URL performance.
Caching for Improved Performance: Used Redis for caching the data
Rate Limiting: Prevents abuse by limiting the number of requests ( 10 requests ) users can make to the API.
Error Handling & Response Codes: Uses appropriate HTTP response codes (200, 401, 404, 500) with clear error messages.
Database used: MongoDB.


# Challenges faced and Solution implemented
During the initial phase, I faced challenges with implementing Google Authentication. I was stuck, but after coming across a helpful Medium article on implementing Google Auth with just the backend, I was able to successfully integrate it.
Next, database querying for analytics was a bit tricky to understand, but with some research and learning, I eventually figured it out.
Dockerizing the app was another new experience for me. I spent time reading articles and watching videos, which helped me grasp the concept and successfully dockerize the application. 

