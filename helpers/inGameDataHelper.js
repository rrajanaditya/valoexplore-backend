
const axios = require('axios')
const wrapper = require('axios-cookiejar-support').wrapper
const CookieJar = require('tough-cookie').CookieJar
const Account = require('../models/accountModel')
const ValorantDB = require('../models/valorantDBModel')


const getSkinVP = async (username, database) => {
    var account = await Account.find({ username: username })
    if (account.length == 0) {
        throw new Error("Invalid Username.")
    } else {
        if (account[0].skinVPList) {
            return account[0].skinVPList
        } else {
            var jar = CookieJar.fromJSON(account[0].Cookie)
            var client = wrapper(axios.create({ jar: jar }));
            client.defaults.headers = { ...client.defaults.headers, ...account[0].headers }
            var response = await client.get(
                `https://pd.${account[0].userData['region']}.a.pvp.net/store/v1/offers/`
            );
            var data = response.data;
            var skinVPList = {}
            data['Offers'].forEach(item => {
                var skin = database['SKINS']["skinUUIDToName"][item['OfferID']];
                skinVPList[skin] = item["Cost"]["85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"];
            })
            await Account.findByIdAndUpdate(account[0]._id, {
                skinVPList
            })
            return skinVPList
        }
    }
}


Date.prototype.toShortFormat = function () {
    const monthNames = ["Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"];
    const day = this.getDate();
    const monthIndex = this.getMonth();
    const monthName = monthNames[monthIndex];
    const year = this.getFullYear();
    return `${day}-${monthName}-${year}`;
};

const AuthReAuthUser = async (username, password) => {
    const getTokens = async (client, uri) => {
        var tokens = {}
        var token_url = new URL(`${uri}`.replace(/#/g, "?"));
        const search_params = token_url.searchParams;
        tokens['accessToken'] = search_params.get('access_token');
        tokens['idToken'] = search_params.get('id_token');
        client.defaults.headers["Authorization"] = `Bearer ${tokens['accessToken']}`
        response = await client.post("https://entitlements.auth.riotgames.com/api/token/v1", {});
        tokens['entitlementsToken'] = response.data['entitlements_token']
        return tokens
    }

    var account = await Account.find({ username: username })
    if (account.length > 0) {
        var lastUpdated = new Date(new Date(account[0].updatedAt).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' }))
        var timeDiff = new Date(new Date() - lastUpdated)
        var hours = timeDiff.toISOString().split("T")[1].split(":")[0]
        var minutes = timeDiff.toISOString().split("T")[1].split(":")[1]
        if (hours < 1 && minutes < 10) {
            return "Auth Success"
        }
        var jar = CookieJar.fromJSON(account[0]['Cookie'])
        var client = wrapper(axios.create({ jar: jar }));
        client.defaults.headers = { ...client.defaults.headers, 'user-agent': account[0].headers['user-agent'] }
        var response = await client.post(
            'https://auth.riotgames.com/api/v1/authorization', {
            "client_id": "play-valorant-web-prod",
            "nonce": "1",
            "redirect_uri": "https://playvalorant.com/opt_in",
            "response_type": "token id_token",
            'scope': 'account openid'
        });
        if (account[0].tokens) {

            var tokens = { ...account[0].tokens, ...await getTokens(client, response.data['response']['parameters']['uri']) }
        } else {
            var tokens = await getTokens(client, response.data['response']['parameters']['uri'])

        }
        var headers = {
            ...client.defaults.headers, "Authorization": `Bearer ${tokens['accessToken']}`,
            "X-Riot-Entitlements-JWT": tokens['entitlementsToken'],
            "X-Riot-ClientVersion": process.env.RIOT_CLIENT_VERSION,
            "X-Riot-ClientPlatform": process.env.RIOT_CLIENT_PLATFORM,
        };
        await Account.findByIdAndUpdate(account[0]._id, {
            Cookie: JSON.stringify(jar.toJSON()),
            headers,
            tokens
        })
    } else {
        var jar = new CookieJar()
        var client = wrapper(axios.create({ jar: jar }));
        const userAgent = `RiotClient/${process.env.RIOT_CLIENT_BUILD} rso-auth (Windows;10;;Professional, x64)`
        var headers = { 'user-agent': userAgent }
        client.defaults.headers = { ...client.defaults.headers, ...headers }
        await client.post(
            'https://auth.riotgames.com/api/v1/authorization', {
            "client_id": "play-valorant-web-prod",
            "nonce": "1",
            "redirect_uri": "https://playvalorant.com/opt_in",
            "response_type": "token id_token",
            'scope': 'account openid'
        });
        var response = await client.put('https://auth.riotgames.com/api/v1/authorization', {
            "language": "en_US",
            "password": `${password}`,
            "type": "auth",
            "username": `${username}`,
            "remember": true
        });
        var tokens = await getTokens(client, response.data['response']['parameters']['uri'])
        var headers = {
            ...client.defaults.headers, "Authorization": `Bearer ${tokens['accessToken']}`,
            "X-Riot-Entitlements-JWT": tokens['entitlementsToken'],
            "X-Riot-ClientVersion": process.env.RIOT_CLIENT_VERSION,
            "X-Riot-ClientPlatform": process.env.RIOT_CLIENT_PLATFORM,
        };
        var response = await client.put("https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant",
            { 'id_token': tokens['idToken'] });
        var userData = { 'region': response.data['affinities']['live'] }
        await Account.create({
            username: username,
            Cookie: JSON.stringify(jar.toJSON()),
            headers: headers,
            tokens,
            userData
        })
    }
    return "Auth Success"
}

const UserData = async (username, refresh = false) => {
    var account = await Account.find({ username: username })
    if (account.length == 0) {
        throw new Error("Invalid Username.")
    } else {
        if (account[0].userData['gameName'] && !refresh) {
            return account[0].userData
        }
        var jar = CookieJar.fromJSON(account[0]['Cookie'])
        var client = wrapper(axios.create({ jar: jar }));
        client.defaults.headers = { ...client.defaults.headers, ...account[0].headers }
        var response = await client.get("https://auth.riotgames.com/userinfo");
        var tokens = {
            ...account[0].tokens, 'puuid': response.data['sub']
        }
        var dateCreated = new Date(response.data['acct']['created_at']).toShortFormat()
        var resp = await client.get(
            `https://pd.${account[0].userData['region']}.a.pvp.net/account-xp/v1/players/${tokens['puuid']}`,
        );
        var userData = {
            ...account[0].userData,
            'country': response.data['country'],
            'gameName': response.data['acct']['game_name'],
            'tagLine': response.data['acct']['tag_line'],
            'emailVerified': response.data['email_verified'],
            'creationDate': dateCreated,
            'Level': resp.data['Progress']['Level'],
            'XP': resp.data['Progress']['XP'],
            'skinVPSpent': account[0].userData.skinVPSpent || 0,
            'battlepassVPSpent': account[0].userData.battlepassVPSpent || 0
        }
        var response = await client.get(`https://pd.${account[0].userData['region']}.a.pvp.net/personalization/v2/players/${tokens['puuid']}/playerloadout`)
        var resp1 = await axios.get(`https://valorant-api.com/v1/playercards/${response.data['Identity']['PlayerCardID'] || ''}`)
        var resp2 = await axios.get(`https://valorant-api.com/v1/playertitles/${response.data['Identity']['PlayerTitleID'] || ''}`)
        userData = {
            ...userData,
            'smallCard': resp1.data['data']['smallArt'] || '',
            'wideCard': resp1.data['data']['wideArt'] || '',
            'title': resp2.data['data']['displayName'] || '',
        }
        await Account.findByIdAndUpdate(account[0]._id, {
            tokens,
            userData,
        })
        return userData
    }
}


const getEntitlements = async (username) => {
    var account = await Account.find({ username: username })
    if (account.length == 0) {
        throw new Error("Invalid Username.")
    } else {
        if (account[0].entitlements) {
            return account[0].entitlements
        } else {
            var jar = CookieJar.fromJSON(account[0]['Cookie'])
            var client = wrapper(axios.create({ jar: jar }));
            client.defaults.headers = { ...client.defaults.headers, ...account[0].headers }
            var response = await client.get(`https://pd.${account[0].userData.region}.a.pvp.net/store/v1/entitlements/${account[0].tokens.puuid}`)
            var data = response.data;
            var entitlements = {}
            data['EntitlementsByTypes'].forEach(item => {
                entitlements[item['ItemTypeID']] = item['Entitlements'];
            });
            await Account.findByIdAndUpdate(account[0]._id, {
                entitlements
            })
            return entitlements
        }
    }
}


const SkinData = async (username, refresh = false) => {
    const processLevelChromaData = (skinData, database, skinVPList, userData, item, opt = "level") => {
        var skin = database['SKINS']["skinUUIDToName"][item['ItemID']];
        if (skin in skinData)
            skinData[skin][opt] += 1
        else {
            var price = 0;
            if (skin in skinVPList)
                price = skinVPList[skin];
            else {
                if (skin.includes("Arcane")) {
                    price = 2380;
                } else if (skin.includes("Champions 2021 Karambit") || skin.includes("Champions 2022 Butterfly Knife")) {
                    price = 5350;
                } else if (skin.includes("Champions 2021 Vandal") || skin.includes("Champions 2022 Phantom")) {
                    price = 2675;
                }
            }
            skinData[skin] = {
                "level": 1, "chroma": 1, "price": price,
                "skinImage": database['SKINS']["skinNameToDetails"][skin]["skinImage"],
                "totalLevel": database['SKINS']["skinNameToDetails"][skin]["totalLevels"],
                "totalChromas": database['SKINS']["skinNameToDetails"][skin]["totalChromas"]
            };
            userData['skinVPSpent'] += price;
        }
    }
    var account = await Account.find({ username: username })
    if (account.length == 0) {
        throw new Error("Invalid Username.")
    } else {
        if (account[0].skinData && !refresh) {
            return account[0].skinData
        } else {
            var entitlements = await getEntitlements(username)
            var valorantDB = await ValorantDB.findById('63f643fd5d779494aa015d94')
            var skinVPList = await getSkinVP(username, valorantDB.database);
            var skinData = {}
            var userData = { ...account[0].userData }
            var data = entitlements['e7c63390-eda7-46e0-bb7a-a6abdacd2433'];
            if (!data) return {};
            data.forEach(item => {
                processLevelChromaData(skinData, valorantDB.database, skinVPList, userData, item);
            });
            data = entitlements['3ad1b2b2-acdb-4524-852f-954a76ddae0a'];
            if (!data) return {};
            data.forEach(item => {
                processLevelChromaData(skinData, valorantDB.database, skinVPList, userData, item, "chroma");
            });
            await Account.findByIdAndUpdate(account[0]._id, {
                userData,
                skinData
            })
            return skinData
        }
    }
}


const BattlepassData = async (username, refresh = false) => {
    var account = await Account.find({ username: username })
    if (account.length == 0) {
        throw new Error("Invalid Username.")
    } else {
        if (account[0].battlepassData && !refresh) {
            return account[0].battlepassData
        } else {
            var valorantDB = await ValorantDB.findById('63f643fd5d779494aa015d94')
            var entitlements = await getEntitlements(username)
            var jar = CookieJar.fromJSON(account[0]['Cookie'])
            var client = wrapper(axios.create({ jar: jar }));
            client.defaults.headers = { ...client.defaults.headers, ...account[0].headers }
            var response = await client.get(`https://pd.${account[0].userData.region}.a.pvp.net/contracts/v1/contracts/${account[0].tokens.puuid}`);
            var data = response.data;
            var tierData = {};
            data['Contracts'].forEach(contracts => {
                if (contracts["ProgressionLevelReached"]) {
                    tierData[contracts["ContractDefinitionID"]] = contracts["ProgressionLevelReached"];
                }
            })
            data = entitlements['f85cb6f7-33e5-4dc8-b609-ec7212301948'];
            if (!data) return {};
            var battlepassData = {}
            var userData = { ...account[0].userData }
            data.forEach(item => {
                battlepassData[valorantDB.database['BP'][item['ItemID']]['displayName']] = {
                    "completedTier": tierData[item['ItemID']],
                    "maxTier": valorantDB.database['BP'][item['ItemID']]['maxTier']
                };
                if (tierData[item['ItemID']] >= 50) {
                    battlepassData[valorantDB.database['BP'][item['ItemID']]
                    ['displayName']]["completed"] = true;
                }
                userData['battlepassVPSpent'] += 1000;
            })
            await Account.findByIdAndUpdate(account[0]._id, {
                userData,
                battlepassData
            })
            return battlepassData
        }
    }
}


const StoreData = async (username, refresh = false) => {
    var account = await Account.find({ username: username })
    if (account.length == 0) {
        throw new Error("Invalid Username.")
    } else {
        if (account[0].storeData && !refresh) {
            return account[0].storeData
        } else {
            var valorantDB = await ValorantDB.findById('63f643fd5d779494aa015d94')
            var skinVPList = await getSkinVP(username, valorantDB.database)
            var jar = CookieJar.fromJSON(account[0]['Cookie'])
            var client = wrapper(axios.create({ jar: jar }));
            client.defaults.headers = { ...client.defaults.headers, ...account[0].headers }
            var response = await client.get(`https://pd.${account[0].userData.region}.a.pvp.net/store/v1/wallet/${account[0].tokens.puuid}`);
            var data = response.data;
            var storeData = { wallet: {}, store: [] }
            storeData.wallet["vp"] = data['Balances']['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'];
            storeData.wallet["rp"] = data['Balances']['e59aa87c-4cbf-517a-5983-6e81511be9b7'];
            var response = await client.get(`https://pd.${account[0].userData.region}.a.pvp.net/store/v2/storefront/${account[0].tokens.puuid}`)
            var data = response.data;
            data['SkinsPanelLayout']['SingleItemOffers'].forEach(item => {
                var name = valorantDB.database['SKINS']['skinUUIDToName'][item];
                storeData.store.push({
                    'skinName': name,
                    'skinImage': valorantDB.database['SKINS']['skinNameToDetails'][name]['skinImage'],
                    'price': skinVPList[name]
                })
            })
            await Account.findByIdAndUpdate(account[0]._id, {
                storeData,
            })
            return storeData
        }
    }
}


const BanData = async (username, refresh = false) => {
    var account = await Account.find({ username: username })
    if (account.length == 0) {
        throw new Error("Invalid Username.")
    } else {
        if (account[0].BanData && !refresh) {
            return account[0].BanData
        } else {
            var jar = CookieJar.fromJSON(account[0]['Cookie'])
            var client = wrapper(axios.create({ jar: jar }));
            client.defaults.headers = { ...client.defaults.headers, ...account[0].headers }
            var response = await client.get(`https://pd.${account[0].userData.region}.a.pvp.net/restrictions/v3/penalties`);
            var data = response.data;
            var banData = { data: [] };
            if (data['Penalties'].length == 0) {
                await Account.findByIdAndUpdate(account[0]._id, {
                    banData,
                })
                return banData
            }
            data['Penalties'].forEach(penalty => {
                if (penalty['WarningEffect']) {
                    var type = penalty['WarningEffect']['WarningType']
                    var tier = penalty['WarningEffect']['WarningTier']
                    banData.data.push(
                        {
                            reason: `Level ${tier} Warning : Reason ${type}`,
                            duration: `Reset On : ${penalty['GamesRemaining']} Game(s)`
                        }
                    )
                }
                if (penalty['QueueDelayEffect']) {
                    var endTime = new Date(penalty['QueueDelayEffect']['StartTime'])
                    endTime.setSeconds(endTime.getSeconds() + penalty['QueueDelayEffect']['DurationSeconds'])
                    if (endTime <= new Date()) {
                        banData.data.push(
                            {
                                reason: `Banned in All Queues`,
                                duration: `Ban Till : ${endTime.toLocaleTimeString()}`
                            }
                        )

                    }
                }
            })
            await Account.findByIdAndUpdate(account[0]._id, {
                banData,
            })
            return banData
        }
    }
}


const RankData = async (username, refresh = false) => {
    var account = await Account.find({ username: username })
    if (account.length == 0) {
        throw new Error("Invalid Username.")
    } else {
        if (account[0].rankData && !refresh) {
            return account[0].rankData
        } else {
            var data = await axios.get("https://valorant-api.com/v1/seasons/")
            data = data.data['data']
            var seasonData = {}
            var temp = {}
            data.forEach(season => {
                var name = season['displayName'];
                temp[season['uuid']] = name
            })
            data.forEach(season => {
                if (season['parentUuid']) {
                    var name = temp[season['parentUuid']] + " : " + season['displayName'];
                } else {
                    var name = season['displayName'];
                }
                seasonData[season['uuid']] = name
            })

            data = await axios.get("https://valorant-api.com/v1/seasons/competitive")
            data = data.data['data']
            var compData = {}
            data.forEach(item => {
                compData[item['seasonUuid']] = item['competitiveTiersUuid']
            })
            data = await axios.get("https://valorant-api.com/v1/competitivetiers")
            data = data.data['data']
            var tierData = {}
            data.forEach(item => {
                tierData[item['uuid']] = item['tiers']

            });

            var rankData = { rank: [] }

            var jar = CookieJar.fromJSON(account[0]['Cookie'])
            var client = wrapper(axios.create({ jar: jar }));
            client.defaults.headers = { ...client.defaults.headers, ...account[0].headers }

            var response = await client.get(`https://pd.${account[0].userData.region}.a.pvp.net/mmr/v1/players/${account[0].tokens.puuid}`);
            data = response.data
            var seasonInfo = data['QueueSkills']['competitive']['SeasonalInfoBySeasonID']
            for (const season in seasonInfo) {
                rankData.rank.push({
                    'season': seasonData[season],
                    'tierIcon': tierData[compData[season]][seasonInfo[season]['Rank']]['largeIcon'],
                    'tierName': tierData[compData[season]][seasonInfo[season]['Rank']]['tierName']
                })
            }
            await Account.findByIdAndUpdate(account[0]._id, {
                rankData,
            })
            return rankData
        }
    }
}

const HistoryData = async (username) => {
    var account = await Account.find({ username: username })
    if (account.length == 0) {
        throw new Error("Invalid Username.")
    } else {

        let data = {
            userData: account[0].userData, rankData: account[0].rankData, skinData: account[0].skinData,
            storeData: account[0].storeData
        }
        return data
    }
}
module.exports = {
    AuthReAuthUser,
    UserData,
    SkinData,
    BattlepassData,
    StoreData,
    BanData,
    RankData,
    HistoryData
}