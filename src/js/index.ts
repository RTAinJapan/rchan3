import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import cheerio from 'cheerio';
import configModule from 'config';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const config: Config = configModule.util.toObject(configModule);
console.log(config);

const main = async () => {
  try {
    if (!config.trackerUrl || !config.trackerUrl.includes('http')) throw new Error('trackerUrl が指定されていないか、何かおかしいです');
    if (!config.username) throw new Error('username が指定されていません。');
    if (!config.password) throw new Error('password が指定されていません。');
    if (!config.eventId || Number.isNaN(config.eventId)) throw new Error('eventId が指定されていません。');
    if (!config.checkInterval || Number.isNaN(config.checkInterval)) throw new Error('checkInterval が指定されていません。');

    // ログイン
    await loginTracker();

    // 定期実行
    checkAndApprove();
    setInterval(() => {
      checkAndApprove();
    }, config.checkInterval * 1000);
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

  // console.log(`status = ${res2.status} ${res2.statusText}`);
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
    if (item.fields.donor__public === '(匿名)' && item.fields.comment === '') {
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
