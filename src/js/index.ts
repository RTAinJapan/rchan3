import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

let config: Config;

/**
 * 環境変数から設定値を取得
 * @returns config
 */
const getConfig = (): Config => {
  const data: Config = {
    trackerUrl: process.env.TRACKER_URL as string,
    username: process.env.TRACKER_USERNAME as string,
    password: process.env.TRACKER_PASSWORD as string,
    eventId: Number(process.env.TRACKER_EVENT_ID as string),
    anonymousName: process.env.TRACKER_ANONYMOUSENAME as string,
    checkInterval: Number(process.env.CHECK_INTERVAL ?? 30 * 1000),
  };

  if (!data.trackerUrl) {
    throw new Error('The environment variable TRACKER_URL is not specified.');
  }

  if (!data.username) {
    throw new Error('The environment variable TRACKER_USERNAME is not specified.');
  }

  if (!data.password) {
    throw new Error('The environment variable TRACKER_PASSWORD is not specified.');
  }

  if (!data.eventId) {
    throw new Error('The environment variable TRACKER_EVENT_ID is not specified.');
  }

  if (!data.anonymousName) {
    throw new Error('The environment variable TRACKER_ANONYMOUSENAME is not specified.');
  }

  return data;
};

const main = async () => {
  try {
    config = getConfig();

    // ログイン
    await loginTracker();

    // 定期実行
    checkAndApprove();
    setInterval(() => {
      checkAndApprove();
    }, config.checkInterval);
  } catch (error) {
    console.error('何かエラーがあった');
    console.error(error);
    process.exit();
  }
};

const loginTracker = async () => {
  // token取得のGET
  let url = `${config.trackerUrl}/admin/`;
  console.log(`GET ${url}`);
  const res1 = await client.get(url);
  let $ = cheerio.load(res1.data);
  let csrfmiddlewaretoken = $('#login-form > input[type=hidden]').attr('value');
  if (!csrfmiddlewaretoken) throw new Error('ログインページのトークン取得に失敗');
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
  const res2 = await client.post(url, params, {
    headers: {
      Referer: `${config.trackerUrl}/admin/login/?next=/admin/`,
    },
  });

  console.log(`status = ${res2.status} ${res2.statusText}`);
  console.log('ログイン完了');
};

const checkAndApprove = async () => {
  const checkUrl = `${config.trackerUrl}/api/v1/search/?all_comments=&event=${config.eventId}&feed=toprocess&type=donation`;
  console.log(`GET ${checkUrl}`);
  const res1 = (await (await client.get(checkUrl)).data) as V1SearchAllComment[];
  if (!Array.isArray(res1)) throw new Error('なんか変です');
  console.log(`レスポンス件数：${res1.length}`);
  // console.log(JSON.stringify(res1, null, '  '));

  for (const item of res1) {
    if (item.fields.donor__public === config.anonymousName && item.fields.comment === '' && item.fields.commentstate === "PENDING") {
      await approveComment(item.pk, config.eventId);
    }
  }
};

/**
 * 寄付コメントをApproveする
 * @param pk pk
 * @param eventId イベントID
 */
const approveComment = async (pk: number, eventId: number) => {
  console.log(`pk=${pk}`);
  const url = `${config.trackerUrl}/api/v1/edit/`;
  const params = new URLSearchParams();
  params.append('commentstate', 'APPROVED');
  params.append('id', pk.toString());
  params.append('readstate', 'IGNORED');
  params.append('type', 'donation');

  // console.log(`url=${url}`);
  // console.log(params.toString());
  const res = await client.post(url, params, {
    headers: {
      Referer: `${config.trackerUrl}/admin/tracker/event/ui/process_donations/${eventId}`,
    },
  });
};

(() => {
  main();
})();
