"use strict";
(() => {
var exports = {};
exports.id = 376;
exports.ids = [376];
exports.modules = {

/***/ 266:
/***/ ((module) => {

module.exports = require("agora-access-token");

/***/ }),

/***/ 185:
/***/ ((module) => {

module.exports = require("mongoose");

/***/ }),

/***/ 686:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ handler)
/* harmony export */ });
/* harmony import */ var _libs_dbConnect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(680);
/* harmony import */ var agora_access_token__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(266);
/* harmony import */ var agora_access_token__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(agora_access_token__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _models_Room__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(101);
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction




function getRtmToken(userId) {
    const appID = "f84852acf83c43938bac98f4bfbd1e94";
    const appCertificate = process.env.AGORA_APP_CERT;
    const account = userId;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    const token = agora_access_token__WEBPACK_IMPORTED_MODULE_1__.RtmTokenBuilder.buildToken(appID, appCertificate, account, agora_access_token__WEBPACK_IMPORTED_MODULE_1__.RtmRole.Rtm_User, privilegeExpiredTs);
    return token;
}
function getRtcToken(roomId, userId) {
    const appID = "f84852acf83c43938bac98f4bfbd1e94";
    const appCertificate = process.env.AGORA_APP_CERT;
    const channelName = roomId;
    const account = userId;
    const role = agora_access_token__WEBPACK_IMPORTED_MODULE_1__.RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    const token = agora_access_token__WEBPACK_IMPORTED_MODULE_1__.RtcTokenBuilder.buildTokenWithAccount(appID, appCertificate, channelName, account, role, privilegeExpiredTs);
    return token;
}
async function handler(req, res) {
    const { method , query  } = req;
    const userId = query.userId;
    await (0,_libs_dbConnect__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Z)();
    switch(method){
        case "GET":
            try {
                const rooms = await _models_Room__WEBPACK_IMPORTED_MODULE_2__/* ["default"].aggregate */ .Z.aggregate([
                    {
                        $match: {
                            status: "waiting"
                        }
                    },
                    {
                        $sample: {
                            size: 1
                        }
                    }
                ]);
                if (rooms.length > 0) {
                    const roomId = rooms[0]._id.toString();
                    await _models_Room__WEBPACK_IMPORTED_MODULE_2__/* ["default"].findByIdAndUpdate */ .Z.findByIdAndUpdate(roomId, {
                        status: "chatting"
                    });
                    res.status(200).json({
                        rooms,
                        rtcToken: getRtcToken(roomId, userId),
                        rtmToken: getRtmToken(userId)
                    });
                } else {
                    res.status(200).json({
                        rooms: [],
                        token: null
                    });
                }
            } catch (error) {
                res.status(400).json(error.message);
            }
            break;
        case "POST":
            const room = await _models_Room__WEBPACK_IMPORTED_MODULE_2__/* ["default"].create */ .Z.create({
                status: "waiting"
            });
            res.status(200).json({
                room,
                rtcToken: getRtcToken(room._id.toString(), userId),
                rtmToken: getRtmToken(userId)
            });
            break;
        default:
            res.status(400).json("no method for this endpoint");
            break;
    }
}


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [622], () => (__webpack_exec__(686)));
module.exports = __webpack_exports__;

})();