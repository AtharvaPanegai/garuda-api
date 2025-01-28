# Garuda API Radar

Garuda API Radar is a comprehensive API monitoring and alerting system designed to help you keep track of your APIs' performance and availability. This project provides a robust backend built with Node.js, Express, and MongoDB, along with various utilities and services to ensure your APIs are always up and running.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- **API Monitoring**: Track the performance and availability of your APIs.
- **Alerting System**: Receive alerts via email when an API goes down.
- **API Key Management**: Secure your APIs with unique API keys.
- **User Authentication**: Secure user authentication and authorization.
- **Project Management**: Manage multiple projects and their APIs.
- **Incident Reporting**: Detailed incident reports for API failures.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/garuda-api-radar.git
    cd garuda-api-radar
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    DB_CONNECTION_STRING=your_mongodb_connection_string
    PORT=4000
    JWT_SECRET=your_jwt_secret
    JWT_EXPIRY=7d
    COOKIE_TIME=7
    EMAIL_FROM=your_email@example.com
    EMAIL_AUTH_TOKEN=your_email_auth_token
    ```

4. Start the server:
    ```sh
    npm start
    ```

## Configuration

The application uses environment variables for configuration. Ensure you have a `.env` file with the necessary variables as shown in the installation section.

## Usage

### Running the Application

To run the application in development mode:
```sh
npm run dev
```

To run the application in production mode:
```sh
npm start
```

## API Documentation

### User Authentication

#### Sign Up
- **Endpoint**: `/api/v1/signup`
- **Method**: `POST`
- **Description**: Register a new user.
- **Request Body**:
    ```json
    {
        "username": "john_doe",
        "emailId": "john@example.com",
        "phoneNumber": "1234567890",
        "companyName": "Example Inc",
        "password": "password123"
    }
    ```
- **Response**:
    ```json
    {
        "success": true,
        "token": "jwt_token",
        "user": {
            "username": "john_doe",
            "emailId": "john@example.com",
            "phoneNumber": "1234567890",
            "companyName": "Example Inc"
        }
    }
    ```

#### Sign In
- **Endpoint**: `/api/v1/signin`
- **Method**: `POST`
- **Description**: Authenticate a user.
- **Request Body**:
    ```json
    {
        "email": "john@example.com",
        "password": "password123"
    }
    ```
- **Response**:
    ```json
    {
        "success": true,
        "token": "jwt_token",
        "user": {
            "username": "john_doe",
            "emailId": "john@example.com",
            "phoneNumber": "1234567890",
            "companyName": "Example Inc"
        }
    }
    ```

### Project Management

#### Create Project
- **Endpoint**: `/api/v1/project/create`
- **Method**: `POST`
- **Description**: Create a new project.
- **Request Body**:
    ```json
    {
        "userId": "user_id",
        "projectName": "New Project"
    }
    ```
- **Response**:
    ```json
    {
        "message": "Project Created successfully!",
        "project": {
            "projectName": "New Project",
            "customer": "user_id"
        }
    }
    ```

#### Create Project API Key
- **Endpoint**: `/api/v1/project/createapikey`
- **Method**: `POST`
- **Description**: Generate an API key for a project.
- **Request Body**:
    ```json
    {
        "userId": "user_id",
        "projectId": "project_id"
    }
    ```
- **Response**:
    ```json
    {
        "message": "API Key for project Created!",
        "apiKey": "generated_api_key"
    }
    ```

### API Monitoring

#### Onboard APIs as per Hits
- **Endpoint**: `/api/v1/radar/monitorapi`
- **Method**: `POST`
- **Description**: Process API hits and onboard APIs.
- **Request Body**:
    ```json
    {
        "projectId": "project_id",
        "method": "POST",
        "path": "/api/v1/signin",
        "headers": {
            "content-type": "application/json"
        },
        "statusCode": 200,
        "responseTime": "266.686 ms"
    }
    ```
- **Response**:
    ```json
    {
        "message": "Hit Recorded!"
    }
    ```

### Incident Reporting

#### Get Cumulative Project Report
- **Endpoint**: `/api/v1/project/report`
- **Method**: `POST`
- **Description**: Get a cumulative report for a project.
- **Request Body**:
    ```json
    {
        "projectId": "project_id"
    }
    ```
- **Response**:
    ```json
    {
        "message": "Project Report Generated Successfully!",
        "projectReport": {
            "project": {
                "projectName": "New Project",
                "customer": "user_id"
            },
            "totalApisCount": 5,
            "totalIncidentsReported": 2,
            "overAllStatusCode": 200,
            "projectAge": "2 days ago",
            "onCallPerson": "John Doe",
            "apiHitsReport": [
                {
                    "date": "2023-10-01",
                    "hits": 100
                }
            ],
            "statusSummaryArray": [
                {
                    "name": "Success",
                    "value": 90
                }
            ],
            "totalApisForProject": [
                {
                    "apiEndPoint": "/api/v1/signin",
                    "apiMethod": "POST"
                }
            ]
        }
    }
    ```

## Contributing

We welcome contributions to Garuda API Radar! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a pull request.

### Code of Conduct

Please adhere to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/) when contributing to this project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

