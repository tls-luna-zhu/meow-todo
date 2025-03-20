# LunaTODO - Cute Pixel Art Todo List

A cute pixel art themed todo list application with social features. Share your todos with friends and keep track of your tasks in style!

## Features

- 🎨 Cute pixel art theme
- 👤 User authentication
- 📝 Create, update, and delete todos
- 👥 Add friends and view their todos
- 📅 Set due dates for todos
- 📱 Responsive design

## Tech Stack

- Next.js 14
- TypeScript
- MongoDB
- NextAuth.js
- Tailwind CSS
- React Icons

## Prerequisites

- Node.js 18 or later
- MongoDB database
- npm or yarn

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/tls-luna-zhu/meow-todo.git
cd meow-todo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add the following environment variables in Vercel:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel deployment URL)

### Other Platforms

1. Build the application:
```bash
npm run build
# or
yarn build
```

2. Start the production server:
```bash
npm start
# or
yarn start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
