const mongoose = require('mongoose')
require('dotenv').config()

const Database_URL = process.env.DB_URL
// mongoose.set('debug', true);
mongoose.connect(Database_URL, {
    //to avoid deprecation warning
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Atlas connection successfull...!")
}).catch((err) => {
    console.log("No connection to Atlas...!" + err)
})
