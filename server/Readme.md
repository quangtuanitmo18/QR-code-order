# Introduction to API

This is the backend API for the Order food project

- Authentication: Login, Register, Logout
- Account: Get personal information, Update personal information
- Dish: Read, Add, Edit, Delete dishes
- Media: Upload images
- Test API

> Important note: occasionally pull new code from my GitHub repo, as I sometimes update the API logic during the video recording process

> In the `server/.env` file, there is a `COOKIE_MODE` attribute, set it to `true` if you want to use cookies for authentication on the server

## Technologies used

Node.js + Fastify + Sqlite

## Installation

Just clone this repository to your machine, cd into the directory, install the packages, and run the `npm run dev` command

```bash
cd server
npm i
npm run dev
```

In case you want to run in production, run the commands

```bash
npm run build
npm run start
```

To view database information, just open Prisma Studio with the command

```bash
npx prisma studio
```

It will run at the URL [http://localhost:5555](http://localhost:5555)

The source code contains a `.env` file for configuration, in this file you can change the port for the backend API, the default port is `4000`

When uploading, images will go into the `/uploads` directory in the `server` folder

## Response format

The response format is JSON, and always has a `message` field, in addition, there may be a `data` or `errors` field

Here is an example of a successful response

```json
{
  "data": {
    "id": 2,
    "name": "Iphone 11",
    "price": 20000000,
    "description": "Description for iPhone 11",
    "image": "http://localhost:4000/static/bec024f9ea534b7fbf078cb5462b30aa.jpg",
    "createdAt": "2024-03-11T03:51:14.028Z",
    "updatedAt": "2024-03-11T03:51:14.028Z"
  },
  "message": "Product created successfully!"
}
```

In case of an error, if the error is related to the body being sent in the wrong format, the server will return a `422` error and the error information as follows

The example below is missing the `price` field in the body

```json
{
  "message": "A validation error occurred when validating the body...",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "undefined",
      "path": ["price"],
      "message": "Required",
      "field": "price"
    }
  ],
  "code": "FST_ERR_VALIDATION",
  "statusCode": 422
}
```

In case of other errors, the server will return the error in the `message` field, for example

```json
{
  "message": "Data not found!",
  "statusCode": 404
}
```

## API details

By default, the API will run at [http://localhost:4000](http://localhost:4000), if you want to change the port, go to the `.env` file to change the port

For regular POST, PUT APIs, the body sent must be JSON, and must have the header `Content-Type: application/json`.

Especially for image upload APIs, it must be sent as `form-data`

User authentication API via session token, this session token is a JWT, the JWT secret key will be stored in the `.env` file and used to create and verify the token

For APIs that require user authentication, such as the `Account` API group, you need to send the accessToken to the server via the header `Authorization: "Bearer <accessToken>"`

### Test API: to know if the API is working

- `GET /test`: Returns a message meaning the API is working

### APIs that need real-time

- `POST /guest/orders`: Create a new order

## Quick setup for Postman

> Currently, there is no Postman collection file, I will update it after finishing the course

I have saved a file named `NextJs Free API.postman_collection.json` in the `server` directory, you just need to import this file into Postman to get my collection. Then create a new environment, set the `host` variable to `http://localhost:4000`, and select this environment when calling the API.

## Default accounts

Admin account: admin@order.com | 123456
User accounts:

- phuminhdat@gmail.com | 123123
- buianhson@gmail.com | 123123
- ngocbichhuynh@gmail.com | 123123
- binhnguyen@gmail.com | 123123
