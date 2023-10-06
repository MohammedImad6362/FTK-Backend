const express = require('express')
require('./db/conn')
const userRouter = require('./router/userRouter')
const instituteRouter = require('./router/instituteRouter')
const levelRouter = require('./router/levelRouter')
const batchRouter = require('./router/batchRouter')
const categoryRouter = require('./router/categoryRouter')
const activityRouter = require('./router/activityRouter')
const videoRouter = require('./router/videoRouter')
const app = express()

const port = process.env.PORT || 9000
app.get("/", (req, res) => {
    res.send("<h1>Server running successfully...!</h1>")
})
app.use(express.json())
app.use('/user', userRouter)
app.use('/institute', instituteRouter)
app.use('/level', levelRouter)
app.use('/batch', batchRouter)
app.use('/category', categoryRouter)
app.use('/activity', activityRouter)
app.use('/video', videoRouter)

app.listen(port, (err) => {
    if (err) throw err
    console.log(`Server running on http://localhost:${port}`)
})