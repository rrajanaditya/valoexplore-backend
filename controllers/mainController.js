const asyncHandler = require('express-async-handler')
const { AuthReAuthUser, UserData, SkinData,
    BattlepassData, StoreData, BanData, RankData, HistoryData } = require('../helpers/inGameDataHelper');


const addAccount = asyncHandler(async (req, res) => {
    if (!req.body.username && !req.body.password) {
        res.status(400)
        throw new Error('Username Password Required');
    }
    try {
        var message = await AuthReAuthUser(req.body.username, req.body.password || '', req.user)
    } catch {
        throw new Error("Auth Error! Wrong Username/Password.")
    }
    res.json({ message })
}
)

const getUserData = asyncHandler(async (req, res) => {
    if (!req.body.username) {
        res.status(400)
        throw new Error('Username Required');
    }
    var refresh = false;
    if (req.body.refresh) {
        refresh = true;
    }
    try {
        await AuthReAuthUser(req.body.username, req.body.password || '', req.user)
    } catch {
        throw new Error("Auth Error! Wrong Username/Password.")
    }
    var userData = await UserData(req.body.username, refresh)
    res.json({ userData })
}
)

const getSkinData = asyncHandler(async (req, res) => {
    if (!req.body.username) {
        res.status(400)
        throw new Error('Username Required');
    }
    var refresh = false;
    if (req.body.refresh) {
        refresh = true;
    }
    try {
        await AuthReAuthUser(req.body.username, req.body.password || '', req.user)
    } catch {
        throw new Error("Auth Error! Wrong Username/Password.")
    }
    var skinData = await SkinData(req.body.username, refresh)
    res.json({ skinData })
}
)

const getBattlePassData = asyncHandler(async (req, res) => {
    if (!req.body.username) {
        res.status(400)
        throw new Error('Username Required');
    }
    var refresh = false;
    if (req.body.refresh) {
        refresh = true;
    }
    try {
        await AuthReAuthUser(req.body.username, req.body.password || '', req.user)
    } catch {
        throw new Error("Auth Error! Wrong Username/Password.")
    }
    var battlepassData = await BattlepassData(req.body.username, refresh)
    res.json({ battlepassData })
}
)

const getStoreData = asyncHandler(async (req, res) => {
    if (!req.body.username) {
        res.status(400)
        throw new Error('Username Required');
    }
    var refresh = false;
    if (req.body.refresh) {
        refresh = true;
    }
    try {
        await AuthReAuthUser(req.body.username, req.body.password || '', req.user)
    } catch {
        throw new Error("Auth Error! Wrong Username/Password.")
    }
    var storeData = await StoreData(req.body.username, refresh)
    res.json({ storeData })
}
)

const getBanData = asyncHandler(async (req, res) => {
    if (!req.body.username) {
        res.status(400)
        throw new Error('Username Required');
    }
    var refresh = false;
    if (req.body.refresh) {
        refresh = true;
    }
    try {
        await AuthReAuthUser(req.body.username, req.body.password || '', req.user)
    } catch {
        throw new Error("Auth Error! Wrong Username/Password.")
    }
    var banData = await BanData(req.body.username, refresh)
    res.json({ banData })
}
)

const getRankData = asyncHandler(async (req, res) => {
    if (!req.body.username) {
        res.status(400)
        throw new Error('Username Required');
    }
    var refresh = false;
    if (req.body.refresh) {
        refresh = true;
    }
    try {
        await AuthReAuthUser(req.body.username, req.body.password || '', req.user)
    } catch {
        throw new Error("Auth Error! Wrong Username/Password.")
    }
    var rankData = await RankData(req.body.username, refresh)
    res.json({ rankData })
}
)



const getHistoryData = asyncHandler(async (req, res) => {
    if (!req.body.username) {
        res.status(400)
        throw new Error('Username Required');
    }
    var historyData = await HistoryData(req.body.username)
    res.json({ historyData })
}
)


// // @desc   Update Goals
// // @route  PUT /api/goals
// // @access Private

// const updateGoals = asyncHandler(async (req, res) => {
//     const goal = await Goal.findById(req.params.id)

//     if (!goal) {
//         res.status(400)
//         throw new Error('Goal Not Found')
//     }

//     const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {new: true})
//     res.status(200).json({ message: `Update goal ${req.params.id}` })

// }
// )
// // @desc   Delete Goals
// // @route  DELETE /api/goals
// // @access Private

// const deleteGoals = asyncHandler(async (req, res) => {
//     res.status(200).json({ message: `Delete goal ${req.params.id}` })

// }
// )

module.exports = {
    addAccount,
    getUserData,
    getSkinData,
    getBattlePassData,
    getStoreData,
    getBanData,
    getRankData,
    getHistoryData
}