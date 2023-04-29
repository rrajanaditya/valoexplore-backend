const axios = require('axios');
class SetupDatabase {
    constructor() {
        this.database = { 'SKINS': {}, 'BP': {}, 'BUDDY': {}, 'CARD': {} };
    }
    async getSkinData() {
        var response = await axios.get('https://valorant-api.com/v1/weapons')
        var data = response.data['data'];
        this.database['SKINS']['skinUUIDToName'] = {}
        this.database['SKINS']['skinNameToDetails'] = {}
        data.forEach(gunType => {
            this.database['SKINS']["skinUUIDToName"][gunType["uuid"]
            ] = "Default " + gunType['displayName']
            this.database['SKINS']["skinNameToDetails"]["Default " + gunType['displayName']] = {
                "skinImage": gunType["displayIcon"],
                "totalLevels": 1,
                "totalChromas": 1
            }
            gunType["skins"].forEach(skins => {
                var temp = {
                    "displayName": skins['displayName'],
                    "skinImage": skins["displayIcon"] == null ? skins['levels'][0]['displayIcon'] : skins['displayIcon'],
                    "totalLevels": skins["levels"].length,
                    "totalChromas": skins["chromas"].length
                }
                this.database['SKINS']["skinUUIDToName"][skins["uuid"]] = skins['displayName']
                this.database['SKINS']["skinNameToDetails"][skins['displayName']] = temp
                skins["levels"].forEach(levels => {
                    this.database['SKINS']["skinUUIDToName"][levels["uuid"]] = skins['displayName']
                })
                skins["chromas"].forEach(chromas => {
                    this.database['SKINS']["skinUUIDToName"][chromas["uuid"]] = skins['displayName']
                })
            })
        })
    }
    async getBattlePassData() {
        var response = await axios.get("https://valorant-api.com/v1/contracts")
        var data = response.data['data']
        data.forEach(contracts => {
            if (contracts['content']['relationType'] == "Season") {
                var maxTier = 0;
                contracts['content']['chapters'].forEach(chapters => {
                    maxTier += chapters['levels'].length;
                })
                this.database['BP'][contracts["uuid"]] = {
                    "displayName": contracts["displayName"],
                    "maxTier": maxTier
                }
            }
        })
    }
    async getBuddyData() {
        var response = await axios.get("https://valorant-api.com/v1/buddies");
        var data = response.data['data'];
        this.database['BUDDY']["buddyUUIDToName"] = {};
        this.database['BUDDY']["buddyNameToDetails"] = {};
        data.forEach(buddy => {
            this.database['BUDDY']["buddyUUIDToName"][buddy["uuid"]] = buddy["displayName"]
            this.database['BUDDY']["buddyNameToDetails"][buddy["displayName"]] = {
                "displayIcon": buddy["displayIcon"]
            };
            buddy["levels"].forEach(level => {
                this.database['BUDDY']["buddyUUIDToName"][level["uuid"]] = buddy["displayName"]
            })
        })

    }
    async getCardData() {
        var response = await axios.get("https://valorant-api.com/v1/playercards")
        var data = response.data['data'];
        data.forEach(card => {
            this.database['CARD'][card['uuid']] = {
                "displayName": card['displayName'],
                "displayIcon": card['largeArt']
            }
        })
    }
    async getAllData() {
        await this.getBattlePassData();
        await this.getCardData();
        await this.getSkinData();
        await this.getBuddyData();
    }
}

module.exports = SetupDatabase