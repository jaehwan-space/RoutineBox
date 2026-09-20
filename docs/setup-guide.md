# 환경 설정 가이드 (계정이 필요한 작업)

아래 항목은 계정·결제 정보가 필요해 직접 수행해야 한다. 완료하면 `.env` 에 값을 채운다.

## 1. Oracle Cloud VM (자체 호스팅)
1. https://cloud.oracle.com 가입 후 **Compute → Instances → Create instance**.
2. Image: **Ubuntu 24.04**. Shape: **VM.Standard.A1.Flex** (Always Free, ARM, 최대 4 OCPU/24GB). 용량 부족(Out of capacity)이면 **VM.Standard.E2.1.Micro** 로 대체하거나 다른 가용 도메인(AD) 선택.
3. SSH 키 쌍 생성 후 개인키 보관. 생성 후 **공인 IP** 를 메모한다.
4. **Networking → VCN → Security List(기본)** 에 Ingress 규칙 추가: TCP 22, 80, 443 (Source 0.0.0.0/0).
5. VM 접속 후 우분투 자체 방화벽 규칙 열기(OCI 이미지는 iptables 로 80/443 이 막혀 있다):
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save
   ```
6. Docker 설치:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker $USER && newgrp docker
   ```

## 2. 도메인 · DNS
1. 도메인 구매(가비아, Cloudflare Registrar 등).
2. DNS **A 레코드**: `@` → VM 공인 IP, (선택) `www` → 같은 IP. 전파 확인: `dig +short <도메인>`.
3. 운영 서브도메인은 `routinebox.jaehwan.kr` (와일드카드 A 레코드로 서버 IP 에 연결됨). 바꾸면 `nginx/prod.conf` 의 `server_name` 도 바꾼다.

## 3. 카카오 로그인
1. https://developers.kakao.com → 내 애플리케이션 → **애플리케이션 추가**.
2. **앱 키 → REST API 키** = `KAKAO_CLIENT_ID`.
3. **카카오 로그인 → 활성화 ON**, **Redirect URI** 등록:
   - `http://localhost:3000/api/auth/kakao/callback`
   - `https://<도메인>/api/auth/kakao/callback`
4. **동의항목**: 닉네임(필수), 카카오계정(이메일) 선택 동의.
5. **보안 → Client Secret 생성**, 활성화 → `KAKAO_CLIENT_SECRET`.
6. **플랫폼 → Web** 에 사이트 도메인 `http://localhost:3000`, `https://<도메인>` 등록.

## 4. 구글 로그인
1. https://console.cloud.google.com → 프로젝트 생성 → **API 및 서비스 → OAuth 동의 화면**(외부, 앱 이름·이메일 입력, 범위 email·profile·openid).
2. **사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID → 웹 애플리케이션**.
3. **승인된 리디렉션 URI**:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://<도메인>/api/auth/google/callback`
4. 클라이언트 ID/보안 비밀번호 → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## 5. 토스페이먼츠 테스트 키 (카드 등록 · 자동결제)
1. https://developers.tosspayments.com 가입 → **API 키** 메뉴 → **API 개별 연동 키** 탭. (결제위젯 연동 키 탭이 아니다.)
2. 클라이언트 키(`test_ck_…`) → `TOSS_CLIENT_KEY` 와 `NEXT_PUBLIC_TOSS_CLIENT_KEY`, 시크릿 키(`test_sk_…`) → `TOSS_SECRET_KEY`.
   결제위젯 연동 키(`test_gck_…` / `test_gsk_…`)를 넣으면 카드 등록창이 `NOT_SUPPORTED_WIDGET_KEY` 오류로 열리지 않는다. 결제 수단 페이지와 API 시작 로그가 이 경우를 알려 준다.
3. `BILLING_KEY_ENCRYPTION_KEY` 는 `openssl rand -hex 32` 로 생성.
4. `.env` 를 바꾼 뒤에는 `pnpm dev` 를 다시 시작한다. `NEXT_PUBLIC_*` 값은 웹 서버가 시작할 때 번들에 들어가고, API 도 시작할 때만 `.env` 를 읽는다.
5. 자동 결제는 API 프로세스 안의 node-cron 이 매일 09:00(KST) 에 실행한다(`BILLING_CRON`, D-1 알림 `REMINDER_CRON` 09:05). 테스트·점검 시 `BILLING_CRON_ENABLED=false` 로 끄고, 관리자 화면 대시보드의 "결제 배치 실행"(기준일 지정 가능)으로 같은 로직을 즉시 돌릴 수 있다.

## 5-1. 관리자 계정
- 시드로 만들기: `SEED_ADMIN_PASSWORD=<비밀번호> pnpm db:seed` → `admin@routinebox.local` (이미 있으면 비밀번호·역할을 맞춘다).
- 기존 회원을 승격: `UPDATE "User" SET role = 'ADMIN' WHERE email = '<이메일>';` 실행 후 다시 로그인한다(역할은 액세스 토큰에 들어가므로 재로그인 필요).
- 관리자 화면은 `/admin`, 헤더의 방패 아이콘으로 진입한다.

## 5-2. 알림 메일 (선택)
`SMTP_HOST`·`SMTP_PORT`·`SMTP_USER`·`SMTP_PASS`·`MAIL_FROM` 을 넣으면 D-1 결제 예정, 결제 완료·실패, 배송 출발, 자동 해지 메일을 보낸다. 비워 두면 알림 이력(`/notifications`)만 남는다.
Gmail 예: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=<계정>`, `SMTP_PASS=<앱 비밀번호 16자>`. 네이버 예: `smtp.naver.com`, 587, 계정·비밀번호(POP3/SMTP 사용 설정 필요).

## 6. 운영 배포
운영 서버는 다른 사이트(jaehwan.kr·blog·redirect·pms)와 함께 쓰는 Oracle Cloud VM 이다. 호스트 nginx 가 80/443 과 인증서(certbot --nginx)를 관리하므로,
RoutineBox 는 nginx·certbot 컨테이너 없이 `docker-compose.prod.yml` 로 **127.0.0.1 에만** 바인딩한다 (web `3300`, api `4300`, DB 는 외부 포트 없음).

### 최초 1회
```bash
# 서버에서: 전용 배포 경로와 표식 파일
sudo mkdir -p /opt/routinebox && sudo chown "$USER" /opt/routinebox
touch /opt/routinebox/.routinebox-deploy-root
# 운영 .env 작성 후 chmod 600 (.env.example 기준):
#   NODE_ENV=production, APP_URL=https://routinebox.jaehwan.kr, COOKIE_SECURE=true
#   POSTGRES_PASSWORD·JWT_*_SECRET·BILLING_KEY_ENCRYPTION_KEY 는 새로 생성 (openssl rand -hex 32)
#   KAKAO_REDIRECT_URI / GOOGLE_REDIRECT_URI = https://routinebox.jaehwan.kr/api/auth/{kakao,google}/callback
#   DATABASE_URL 은 compose 가 주입하므로 넣지 않는다

# 로컬에서: 코드 동기화·빌드·기동
./deploy/deploy.sh <ssh호스트>

# 서버에서: 호스트 nginx 에 server 블록 추가 + 인증서 (다른 사이트 설정은 건드리지 않는다)
sudo cp /opt/routinebox/nginx/prod.conf /etc/nginx/sites-available/routinebox.jaehwan.kr
sudo ln -s /etc/nginx/sites-available/routinebox.jaehwan.kr /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d routinebox.jaehwan.kr

# 상품 시드 (이미 있는 상품은 건너뜀)
cd /opt/routinebox && docker compose -f docker-compose.prod.yml exec api pnpm --filter @routinebox/api exec prisma db seed
```

### 이후 배포
```bash
./deploy/deploy.sh <ssh호스트>   # DB 백업(backups/) → rsync → 빌드 → health 대기 → 실패 시 이전 이미지로 롤백
```
`NEXT_PUBLIC_*` 는 web 이미지 빌드 시 번들에 들어가므로 서버 `.env` 에서 바꾼 뒤에도 배포 스크립트로 다시 빌드해야 한다.
카카오·구글 개발자 콘솔에 운영 Redirect URI 와 사이트 도메인(`https://routinebox.jaehwan.kr`)을 등록해야 소셜 로그인이 동작한다.
