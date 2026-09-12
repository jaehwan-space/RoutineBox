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
3. `nginx/prod.conf` 의 `DOMAIN` 을 실제 도메인으로 치환한다.

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

## 5. 토스페이먼츠 테스트 키 (2주차 카드 등록 · 3주차 자동결제)
1. https://developers.tosspayments.com 가입 → **API 키** 메뉴 → **API 개별 연동 키** 탭. (결제위젯 연동 키 탭이 아니다.)
2. 클라이언트 키(`test_ck_…`) → `TOSS_CLIENT_KEY` 와 `NEXT_PUBLIC_TOSS_CLIENT_KEY`, 시크릿 키(`test_sk_…`) → `TOSS_SECRET_KEY`.
   결제위젯 연동 키(`test_gck_…` / `test_gsk_…`)를 넣으면 카드 등록창이 `NOT_SUPPORTED_WIDGET_KEY` 오류로 열리지 않는다. 결제 수단 페이지와 API 시작 로그가 이 경우를 알려 준다.
3. `BILLING_KEY_ENCRYPTION_KEY` 는 `openssl rand -hex 32` 로 생성.
4. `.env` 를 바꾼 뒤에는 `pnpm dev` 를 다시 시작한다. `NEXT_PUBLIC_*` 값은 웹 서버가 시작할 때 번들에 들어가고, API 도 시작할 때만 `.env` 를 읽는다.

## 6. 운영 배포 (4주차)
```bash
# VM 에서
git clone https://github.com/jaehwan-space/RoutineBox.git && cd RoutineBox
cp .env.example .env && nano .env            # 운영 값 입력 (APP_URL=https://<도메인>, COOKIE_SECURE=true, 시크릿 교체)
sed -i "s/DOMAIN/<도메인>/g" nginx/prod.conf
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build db api web
# 최초 인증서 발급 (nginx 는 80 만 먼저 열어 challenge 응답)
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot certonly --webroot -w /var/www/certbot -d <도메인> --email <이메일> --agree-tos --no-eff-email
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx certbot
```
GitHub Actions 자동 배포용 Secrets: `OCI_HOST`(공인 IP), `OCI_USER`(ubuntu), `OCI_SSH_KEY`(개인키). 배포 워크플로는 4주차에 추가한다.
