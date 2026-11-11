# Kết nối và xử lý lỗi Control API staging

Tài liệu này hướng dẫn kết nối OCodeJS Server Control Center tại `https://ocodejs.co` với Control API staging. Frontend là GitHub Pages tĩnh; API chạy trên Cloudflare Workers staging độc lập.

## Endpoint chính xác

- API base: `https://ocodejs-server-api-staging.ocodejs-df1.workers.dev/api/v1`
- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`
- Service Registry: `GET /services`
- Agent Registry: `GET /agents`
- Provider Registry: `GET /providers`
- Runtime: `GET /runtime/status`
- MCP Connections: `GET /mcp/connections`

Dashboard chỉ dùng GET, `cache: no-store`, không cần API key cho các route đọc staging hiện tại và không được đưa secret vào HTML, query string hoặc trình duyệt.

## Cấu hình CORS cho domain

Control API staging phải cho phép origin chính xác của Pages:
- `https://ocodejs.co`
- `https://ocodejs.github.io` (fallback)

Source Worker khai báo hai origin mặc định trong `DEFAULT_ALLOWED_ORIGINS`. Sau khi thay đổi source, cần triển khai phiên bản mới lên đúng Worker `ocodejs-server-api-staging` ở staging rồi kiểm tra lại. Không triển khai vào Worker Production. Không dùng wildcard `*`.

Nếu dùng thêm `https://www.ocodejs.co`, chỉ thêm origin này sau khi hostname đó được cấu hình DNS và Pages riêng.

## Kiểm tra kết nối theo thứ tự

1. Mở endpoint liveness trong Safari: `https://ocodejs-server-api-staging.ocodejs-df1.workers.dev/api/v1/health/live`
2. Kết quả hợp lệ phải là HTTP 200 và JSON có `service: "control-api"`, `live: true`, `checkedAt`.
3. Mở `/api/v1/health/ready`; kết quả phải có `ready: true`.
4. Mở `/api/v1/services`; xác nhận có mảng `services`, `checkedAt` mới và từng service có `id`, `name`, `state`.
5. Mở `https://ocodejs.co`, nhấn **Refresh** trong Server Dashboard.

## Quy tắc dữ liệu và trạng thái

- Mỗi lần Refresh xóa snapshot hiển thị trước đó và yêu cầu dữ liệu mới; không fallback sang localStorage, cache hoặc dữ liệu mẫu.
- Chỉ chấp nhận snapshot có `checkedAt` hợp lệ, không ở tương lai quá 15 giây và không cũ hơn 60 giây.
- Chỉ trạng thái `healthy` do API trả về trong snapshot hợp lệ mới được tính Healthy.
- `degraded`, `unavailable`, `not_configured`, `unknown` không được nâng lên Healthy.
- Thiếu trường, sai schema, HTTP error, timeout, DNS hoặc CORS failure khiến dashboard hiển thị **UNVERIFIED**, xóa service rows và đặt số Healthy thành `— / —`.
- Không được suy ra API healthy chỉ vì trang HTML hoặc GitHub Pages tải thành công.
- Request mới hơn luôn thắng; response cũ đến muộn bị bỏ qua.

## Xử lý lỗi phổ biến

| Triệu chứng | Kiểm tra |
|---|---|
| Safari không mở được workers.dev | Kiểm tra hostname, Worker staging có deployment hay không và DNS resolver |
| Endpoint mở trực tiếp được nhưng Dashboard báo UNVERIFIED | Kiểm tra CORS có `Access-Control-Allow-Origin: https://ocodejs.co` |
| HTTP 404 | Kiểm tra đúng base path `/api/v1` và route |
| HTTP 5xx | Mở Cloudflare Workers → `ocodejs-server-api-staging` → Logs/Traces; đối chiếu `X-Request-Id` |
| Snapshot stale hoặc thiếu checkedAt | Kiểm tra Worker version/response contract; dashboard không chấp nhận dữ liệu cũ |
| Pages load nhưng API lỗi | Pages và Control API là hai deployment độc lập; kiểm tra riêng DNS/CORS/API |

## Giới hạn hiện tại

Control API staging hiện là API đọc dữ liệu, không phải hệ thống lưu lịch sử dashboard. Worker có structured logs; Analytics Engine binding và kho audit truy vấn chưa được cấu hình. Không hiển thị biểu đồ lịch sử, uptime hoặc metrics giả. Auth.js Account Portal, AI inference và agent execution vẫn chưa được bật.

## An toàn triển khai

- Chỉ thay đổi và xác minh `ocodejs-server-api-staging`.
- Không thay Production Worker, secrets, database hoặc DNS ngoài cấu hình domain đã được phê duyệt.
- Không merge PR hoặc triển khai Production khi chưa có xác nhận riêng.


## DNS failure after Worker deployment

The staging Worker upload and 100% deployment can succeed while the public `workers.dev` hostname remains unreachable. A GitHub Actions smoke test on 2026-11-11 observed `getaddrinfo ENOTFOUND ocodejs-server-api-staging.ocodejs-df1.workers.dev`; this is a DNS resolution failure, not an API healthy response.

Check in the **Ocodejs** Cloudflare account:
1. Open **Workers & Pages → Overview** and confirm the account subdomain is `ocodejs-df1`.
2. Open `ocodejs-server-api-staging` → **Settings → Domains & Routes** and confirm its workers.dev hostname is enabled.
3. Confirm the account workers.dev hostname resolves from an external DNS resolver before treating the API as reachable.
4. If workers.dev remains unavailable, an API custom hostname such as `api-staging.ocodejs.dev` can be considered only after explicit approval to add a DNS/custom-domain route to the active `ocodejs.dev` zone.

Do not mark the API healthy based only on a successful Cloudflare upload/deployment response. The runtime smoke test must pass liveness, readiness, a fresh Service Registry response and the exact `https://ocodejs.co` CORS preflight.
