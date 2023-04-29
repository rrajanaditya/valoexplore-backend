const express = require('express');
const router = express.Router()

const { addAccount, getUserData, getSkinData,
    getBattlePassData, getStoreData, getBanData, getRankData, getHistoryData } = require('../controllers/mainController')


router.post("/authenticate", addAccount)
router.post("/userdata", getUserData)
router.post("/skindata", getSkinData)
router.post("/battlepassdata", getBattlePassData)
router.post("/storedata", getStoreData)
router.post("/bandata", getBanData)
router.post("/rankdata", getRankData)
router.post("/historydata", getHistoryData)


module.exports = router