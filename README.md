# PERN Social Media App | BACKEND

Node Express Social Media API that allows users to create posts,likes ,comments and etc.

### Social Media App App | Frontend

[https://github.com/Lspacedev/social-media-app-frontend](https://github.com/Lspacedev/social-media-app-frontend)

## Prerequisites

- Nodejs
- Prisma
- A Supabase account, follow the link [here](https://supabase.com/)

## Installation

1. Clone the repository

```bash
git@github.com:Lspacedev/social-media-app-backend.git
```

2. Navigate to the project folder

```bash
cd social-media-app-backend
```

3.  Install all dependencies

```bash
npm install
```

4. Create an env file and add the following:

```bash
DATABASE_URL="Postgres database Uri"

JWT_SECRET="Jwt secret"

SUPABASE_PROJECT_URL="Supabase project url"
SUPABASE_ANON_KEY="Supabase anon key"
CLIENT_URL="Client app url"

```

5. Run the project

```bash
node app
```

## Usage

1. The server should run on PORT 3000, unless a port is specified.
2. Use http://localhost:3000, to test the API on Postman or any other tool.

## Routes:

API is built using a Node Express server, with PostgreSQL as a database.
API uses JWT tokens to authenticate user.

#### Index Router:

- Sign up for an account.
- Log in to an account.

Endpoints

```python
    1. POST /sign-up
        Inputs: username, email, password, confirmPassword

    2.1 POST /log-in
            Inputs: username, password
    2.2 POST /api/guest-log-in

```

#### Users Router:

- Get all users.
- Get individual user.
- Get user feed.
- Get user following feed.
- Get user liked posts.
- Get user followers and following
- Follow and unfollow
- Like and unlike

- Get user messages
- Create message
- Create reply
- Delete notification.

Endpoints

```python
    1. GET /users

    2. GET /users/userId
            Params: userId


    3. PUT /users/userId
            Params: userId
            Inputs: username, image (profile pic and header)

    4. GET /users/userId/feed
            Params: userId

    5. GET /users/userId/followingFeed
            Params: userId

    6. GET /users/userId/likedPosts
            Params: userId

    7. GET /users/userId/followers
            Params: userId

    8.  GET /users/userId/following
            Params: userId

    9. POST /users/userId/following
            Params: userId

    10. DELETE /users/userId/unfollow
            Params: userId


    11. GET /users/userId/messages
            Params: userId

    12. GET /users/userId/messages/:messageId
            Params: userId

    13. POST /users/userId/messages
            Params: userId

    Replies
    14. POST /users/userId/messages/:messageId
            Params: userId, messageId
            Inputs: text

    15. DELETE /users/userId/notifications/:notificationId
            Params: userId, notificationId

```

#### Posts Router:

- Get all products.
- Get individual product.
- Buy product

Endpoints

```python
    1. GET /users/:userId/posts
        Params: userId
    2. GET /users/:userId/posts/:postId
        Params: postId

    3. POST /users/:userId/posts
        Params: userId
        Inputs: text, image

    4. PUT /users/:userId/posts
        Params: userId
        Inputs: text, image

    5. DELETE /users/:userId/posts/:postId
        Params: userId, postId

    6. GET /users/:userId/posts/:postId/comments
        Params: userId, postId

    7. GET /users/:userId/posts/:postId/comments/:commentId
        Params: userId, postId, commentId

    8. POST /users/:userId/posts/:postId/comments
        Params: userId, postId
        Inputs: commentText

    9. PUT /users/:userId/posts/:postId/comments/:commentId
        Params: userId, postId, commentId
        Inputs: commentText

    10. DELETE /users/:userId/posts/:postId/comments/:commentId
        Params: userId, postId, commentId

    11. POST /users/:userId/posts/:postId/likes
        Params: userId, postId

    12. DELETE /users/:userId/posts/:postId/likes
        Params: userId, postId






```

## Tech Stack

- NodeJs
- Express
- PostgreSQL

- Supabase
- Socket.io
