# Rちゃん3号

Donation Trackerで匿名のコメント無し寄付を自動承認する

## Config

- 環境変数に以下を指定
  - .envではクオートで括る

```
TRACKER_URL=Donation TrackerのURL
TRACKER_USERNAME=Trackerの作業ユーザ名
TRACKER_PASSWORD=Trackerの作業ユーザパスワード
TRACKER_EVENT_ID=TrackerのイベントID
TRACKER_ANONYMOUSENAME=匿名寄付の際に入る名前
CHECK_INTERVAL=チェック間隔(ミリ秒)
```

## 実行

- 環境変数設定済みの場合

```bash
npm run start
```

- .envから環境変数を読み込んで実行する場合

```bash
npx dotenv -- npm run start
```
