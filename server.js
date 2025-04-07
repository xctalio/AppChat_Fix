const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const http = require('http')
const socketIo = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// Koneksi MongoDB 
mongoose.Promise = global.Promise
mongoose.set('strictQuery', true)
mongoose.connect('mongodb://127.0.0.1:27017/belajar_nodejs', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err))

// Schema
const Message = mongoose.model('Message', {
  nama: String,
  pesan: String
})

const Badword = mongoose.model('Badword', {
  word: String
})

// Middleware
app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Routes
app.get('/pesan', async (req, res) => {
  try {
    const pesan = await Message.find().sort({ _id: 1 })
    res.send(pesan)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.post('/pesan', async (req, res) => {
  try {
    const message = new Message(req.body)
    const savedMessage = await message.save()

    const badwords = await Badword.find()
    let filteredText = savedMessage.pesan

    for (const bad of badwords) {
      const regex = new RegExp(`\\b${bad.word}\\b`, 'gi')
      filteredText = filteredText.replace(regex, '😐'.repeat(bad.word.length))
    }

    const finalMessage = { nama: savedMessage.nama, pesan: filteredText }
    io.emit('pesan', finalMessage)

    res.sendStatus(200)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

app.delete('/pesan', async (req, res) => {
  try {
    await Message.deleteMany({})
    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

// Socket.io
io.on('connection', socket => {
  console.log('User connected')
})

// Start server
const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`)
})
