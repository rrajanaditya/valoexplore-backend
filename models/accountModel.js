const mongoose = require('mongoose')


const accountSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please enter a username']
    },
    Cookie: {
        type: String,
    },
    headers: {
        type: Object,
    },
    tokens: {
        type: Object,
    },
    userData: {
        type: Object,
    },
    entitlements: {
        type: Object
    },
    skinVPList: {
        type: Object
    },
    skinData: {
        type: Object
    },
    battlepassData: {
        type: Object
    },
    storeData: {
        type: Object
    },
    banData: {
        type: Object
    },
    rankData: {
        type: Object
    }
}, {
    timestamps: true,
})

module.exports = mongoose.model('Account', accountSchema)