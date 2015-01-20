vTaiwan.tw
==========

行政院法規線上諮詢系統

* 開發在 `gh-pages` 分支，預覽在 https://demo.vtaiwan.tw/
 * Please send pull requests and commits toward `gh-pages`
* 部署在 `master` 分支，會在 https://vtaiwan.tw/
 * This require a manual merge and will take effect in 1hr (after CloudFlare cache expiry)

目前的預計時程是 1/31 上線。

## 部署機的範例設定

分為兩個 process 來跑（可以跑在不同的 screen 或 rc.local 裡）：

```
perl -e while (sleep 60) { system("npm install && gulp") if `git pull 2>&1` =~ /-> origin.master/ }
env USE_HTTPS=1 forever server.js
```

然後再用 CloudFlare 的自動 SSL 連到 server 上即可。

目前正計劃加上 INDEX_URL 參數後 Dockerize。
