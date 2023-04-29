const express = require('express')
const dotenv = require('dotenv').config()
const updateDotenv = require('update-dotenv')
const { errorHandler } = require('./middleware/errorMiddleware')
const SetupDatabase = require('./helpers/databaseSetupHelper')
const connectDB = require('./config/db')
const axios = require('axios')
const cors = require('cors')
const ValorantDB = require('./models/valorantDBModel')
const port = process.env.PORT || 5000

connectDB()

const interval = async () => {
    var setupDatabase = new SetupDatabase();
    await setupDatabase.getAllData();
    var valorantDB = await ValorantDB.findById('63f643fd5d779494aa015d94')
    if (valorantDB) {
        await ValorantDB.findByIdAndUpdate("63f643fd5d779494aa015d94", {
            database: setupDatabase.database
        }, { new: true })
    } else {
        await ValorantDB.create({
            database: setupDatabase.database
        })
    }
    var response = await axios.get("https://valorant-api.com/v1/version");
    var clientBuild = response.data['data']['riotClientBuild'];
    var clientVersion = response.data['data']['riotClientVersion'].split("-shipping").join('');
    updateDotenv({
        RIOT_CLIENT_BUILD: clientBuild,
        RIOT_CLIENT_VERSION: clientVersion
    })
    console.log("Updated Valorant Database")
    setTimeout(interval, 900000)
};
const app = express()


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())



app.use('/api', require('./routes/mainRoutes'))

app.use(errorHandler)

app.listen(port, () => {
    const timeout = setTimeout(interval, 20000);
    console.log(`Server started on port ${port}`)
})
