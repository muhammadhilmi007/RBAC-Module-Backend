# REST FULL API WITH EXPRESS JS AND POSTGRESQL

## Description

This is a REST full API created with Express JS and PostgreSQL. It provides endpoints for creating, reading, updating and deleting users, products and orders.

## Getting Started

### Prerequisites

* Node.js installed on your machine
* PostgreSQL installed on your machine

### Installation

* Clone the repository
* Run `npm install` to install the dependencies
* Create a PostgreSQL database and update the `DATABASE_URL` environment variable in the `.env` file
* Run `npm run migrate` to create the database tables
* Run `npm run seed` to seed the database with some sample data
* Run `npm start` to start the server

### Testing

* Run `npm test` to run the tests

### Endpoints

#### Users

* `POST /users`: Create a new user
* `GET /users`: Get all users
* `GET /users/:id`: Get a user by ID
* `PUT /users/:id`: Update a user
* `DELETE /users/:id`: Delete a user

#### Products

* `POST /products`: Create a new product
* `GET /products`: Get all products
* `GET /products/:id`: Get a product by ID
* `PUT /products/:id`: Update a product
* `DELETE /products/:id`: Delete a product

#### Orders

* `POST /orders`: Create a new order
* `GET /orders`: Get all orders
* `GET /orders/:id`: Get an order by ID
* `PUT /orders/:id`: Update an order
* `DELETE /orders/:id`: Delete an order

### Authentication

* The API uses JSON Web Tokens (JWT) for authentication. To authenticate, send a `POST` request to `/auth/login` with a valid username and password.
* The API will return a JWT token which can be used to authenticate subsequent requests.
* The token should be sent in the `Authorization` header of each request.

### Authorization

* The API uses role-based access control (RBAC) to authorize requests.
* The API has three roles: `admin`, `user` and `guest`.
* The `admin` role has all permissions.
* The `user` role has read-only permissions.
* The `guest` role has no permissions.
* To authorize a request, send a `POST` request to `/auth/login` with a valid username and password.
* The API will return a JWT token which can be used to authorize subsequent requests.
* The token should be sent in the `Authorization` header of each request.

### Environment Variables

* `DATABASE_URL`: The URL of the PostgreSQL database
* `JWT_SECRET`: The secret key used to sign JWT tokens
* `JWT_EXPIRES_IN`: The time in seconds that the JWT token is valid for
* `PORT`: The port number that the server should listen on

### Built With

* [Express JS](https://expressjs.com/)
* [PostgreSQL](https://www.postgresql.org/)
* [TypeScript](https://www.typescriptlang.org/)
* [TypeORM](https://typeorm.io/)
* [JWT](https://jwt.io/)

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Authors

* [muhammadhilmi007](https://github.com/muhammadhilmi007)
