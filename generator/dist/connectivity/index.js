"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadReplayArtifact = exports.writeReplayArtifact = exports.extractDocument = exports.createMonotonicClock = exports.runLiveFetchSession = void 0;
var session_1 = require("./session");
Object.defineProperty(exports, "runLiveFetchSession", { enumerable: true, get: function () { return session_1.runLiveFetchSession; } });
Object.defineProperty(exports, "createMonotonicClock", { enumerable: true, get: function () { return session_1.createMonotonicClock; } });
Object.defineProperty(exports, "extractDocument", { enumerable: true, get: function () { return session_1.extractDocument; } });
var replay_writer_1 = require("./replay-writer");
Object.defineProperty(exports, "writeReplayArtifact", { enumerable: true, get: function () { return replay_writer_1.writeReplayArtifact; } });
var replay_loader_1 = require("./replay-loader");
Object.defineProperty(exports, "loadReplayArtifact", { enumerable: true, get: function () { return replay_loader_1.loadReplayArtifact; } });
//# sourceMappingURL=index.js.map