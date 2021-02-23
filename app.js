const express = require('express');
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const socketIO = require('socket.io');

const MongoStore = require('connect-mongo')(session);

const sockets = require('./sockets/sockets');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uaachat';

const appRouteController = require('./routes/appRoute');
const authRouteController = require('./routes/authRoute');
const indexRouteController = require('./routes/indexRoute');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

mongoose.connect(mongoUri, { useNewUrlParser: true, auto_reconnect: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

app.use(express.static(path.join(__dirname, 'public')));

// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const sessionOptions = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  },
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
});

app.use(sessionOptions);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/', indexRouteController);
app.use('/app', appRouteController);
app.use('/auth', authRouteController);

io.on('connection', (socket) => {
  sockets(socket, io);
});

server.listen(PORT, () => {
  console.log(`Server is on port ${PORT}`);
});
