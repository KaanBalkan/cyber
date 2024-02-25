"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Room.ts
var mongoose_1 = require("mongoose");
var RoomSchema = new mongoose_1.default.Schema({
    status: String,
    lastActive: { type: Date, default: Date.now },
});
exports.default = mongoose_1.default.models.Room || mongoose_1.default.model("Room", RoomSchema);
