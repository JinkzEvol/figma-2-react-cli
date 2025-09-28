"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmLargeDocument = confirmLargeDocument;
function confirmLargeDocument(context) {
    if (process.env.LARGE_DOC_AUTO_ACCEPT === '1')
        return { accepted: true };
    if (process.env.LARGE_DOC_AUTO_DECLINE === '1')
        return { accepted: false, reason: 'Env decline' };
    return { accepted: false, reason: 'No interactive confirmation implemented' };
}
//# sourceMappingURL=confirmLargeDoc.js.map