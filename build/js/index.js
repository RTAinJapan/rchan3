"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const axios_cookiejar_support_1 = require("axios-cookiejar-support");
const tough_cookie_1 = require("tough-cookie");
const cheerio_1 = __importDefault(require("cheerio"));
const config_1 = __importDefault(require("config"));
const jar = new tough_cookie_1.CookieJar();
const client = axios_cookiejar_support_1.wrapper(axios_1.default.create({ jar }));
const config = config_1.default.util.toObject(config_1.default);
console.log(config);
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!config.trackerUrl || !config.trackerUrl.includes('http'))
            throw new Error('trackerUrl が指定されていないか、何かおかしいです');
        if (!config.username)
            throw new Error('username が指定されていません。');
        if (!config.password)
            throw new Error('password が指定されていません。');
        if (!config.eventId || Number.isNaN(config.eventId))
            throw new Error('eventId が指定されていません。');
        if (!config.checkInterval || Number.isNaN(config.checkInterval))
            throw new Error('checkInterval が指定されていません。');
        // ログイン
        yield loginTracker();
        // 定期実行
        checkAndApprove();
        setInterval(() => {
            checkAndApprove();
        }, config.checkInterval * 1000);
    }
    catch (error) {
        console.error('何かエラーがあった');
        console.error(error);
        process.exit();
    }
});
const loginTracker = () => __awaiter(void 0, void 0, void 0, function* () {
    // token取得のGET
    let url = `${config.trackerUrl}/admin/`;
    console.log(`GET ${url}`);
    const res1 = yield client.get(url);
    let $ = cheerio_1.default.load(res1.data);
    let csrfmiddlewaretoken = $('#login-form > input[type=hidden]').attr('value');
    if (!csrfmiddlewaretoken)
        throw new Error('ログインページのトークン取得に失敗');
    // console.log(`csrfmiddlewaretoken=${csrfmiddlewaretoken}`);
    // console.log(res1.headers['set-cookie']);
    // ログインのPOST
    url = `${config.trackerUrl}/admin/login/?next=/admin/`;
    const params = new URLSearchParams();
    params.append('csrfmiddlewaretoken', csrfmiddlewaretoken);
    params.append('username', config.username);
    params.append('password', config.password);
    params.append('next', '/admin/');
    console.log(`POST ${url}`);
    // console.log(params.toString());
    const res2 = yield client.post(url, params, {
        headers: {
            Referer: `${config.trackerUrl}/admin/login/?next=/admin/`,
        },
    });
    // console.log(`status = ${res2.status} ${res2.statusText}`);
    console.log('ログイン完了');
});
const checkAndApprove = () => __awaiter(void 0, void 0, void 0, function* () {
    const checkUrl = `${config.trackerUrl}/api/v1/search/?all_comments=&event=${config.eventId}&feed=toprocess&type=donation`;
    console.log(`GET ${checkUrl}`);
    const res1 = (yield (yield client.get(checkUrl)).data);
    if (!Array.isArray(res1))
        throw new Error('なんか変です');
    console.log(`レスポンス件数：${res1.length}`);
    // console.log(JSON.stringify(res1, null, '  '));
    for (const item of res1) {
        if (item.fields.donor__public === '(匿名)' && item.fields.comment === '') {
            yield approveComment(item.pk, config.eventId);
        }
    }
});
/**
 * 寄付コメントをApproveする
 * @param pk pk
 * @param eventId イベントID
 */
const approveComment = (pk, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`pk=${pk}`);
    const url = `${config.trackerUrl}/api/v1/edit/`;
    const params = new URLSearchParams();
    params.append('commentstate', 'APPROVED');
    params.append('id', pk.toString());
    params.append('readstate', 'IGNORED');
    params.append('type', 'donation');
    // console.log(`url=${url}`);
    // console.log(params.toString());
    const res = yield client.post(url, params, {
        headers: {
            Referer: `${config.trackerUrl}/admin/tracker/event/ui/process_donations/${eventId}`,
        },
    });
});
(() => {
    main();
})();
//# sourceMappingURL=index.js.map