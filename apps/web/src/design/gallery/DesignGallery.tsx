"use client";

import { Bell, Box, Mail, Search, ShoppingCart, Sun } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Chip, Dialog, EmptyState, IconButton, Input, Select, Skeleton, Stepper, useToast, type BadgeStatus } from "@/components/ui";
import { useTheme } from "@/design/theme";
import styles from "./DesignGallery.module.scss";

const COLOR_TOKENS = [
  "bg", "surface", "surface-raised", "surface-sunken", "text", "text-secondary", "text-muted", "border", "border-strong",
  "primary", "primary-hover", "primary-soft", "primary-text", "accent", "accent-soft", "success", "success-soft", "warning", "warning-soft", "danger", "danger-soft",
];
const TYPE_SCALE: Array<[string, string]> = [["4xl", "34px"], ["3xl", "28px"], ["2xl", "24px"], ["xl", "20px"], ["lg", "18px"], ["md", "16px"], ["base", "15px"], ["sm", "13px"], ["xs", "12px"]];
const SPACES = [4, 8, 12, 16, 24, 32, 40, 48, 64];
const STATUSES: BadgeStatus[] = ["active", "paused", "failed", "pending", "cancelled", "accent", "neutral"];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Swatches() {
  return (
    <div className={styles.swatches}>
      {COLOR_TOKENS.map((t) => (
        <div key={t} className={styles.swatch}>
          <span className={styles.swatchColor} style={{ background: `var(--color-${t})` }} />
          <code>--color-{t}</code>
        </div>
      ))}
    </div>
  );
}

export function DesignGallery() {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [qty, setQty] = useState(2);
  const [open, setOpen] = useState(false);
  const [chip, setChip] = useState("세제");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>루틴박스 디자인 시스템</h1>
          <p>이 프로젝트 전용 토큰과 컴포넌트. 개발 환경에서만 열린다.</p>
        </div>
        <Select label="테마" value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")} className={styles.themeSelect}>
          <option value="system">시스템</option>
          <option value="light">라이트</option>
          <option value="dark">다크</option>
        </Select>
      </header>

      <Section id="color" title="색 (의미 토큰)">
        <div className={styles.twoThemes}>
          <div className={styles.themeCol} data-theme="light"><h3>라이트</h3><Swatches /></div>
          <div className={styles.themeCol} data-theme="dark"><h3>다크</h3><Swatches /></div>
        </div>
      </Section>

      <Section id="type" title="타이포그래피 (Pretendard)">
        {TYPE_SCALE.map(([name, px]) => (
          <p key={name} className={styles.typeRow} style={{ fontSize: px }}>
            <code>{name} · {px}</code> 세제, 화장지, 생수처럼 떨어질 때쯤 알아서 도착합니다
          </p>
        ))}
        <p className={styles.typeRow} style={{ fontSize: "24px", fontWeight: 700 }}><code>가격</code> <span className={styles.nums}>12,900원 · 다음 결제 9/05 · D-3</span></p>
      </Section>

      <Section id="space" title="간격 · 반경">
        <div className={styles.spaceRow}>{SPACES.map((s) => <span key={s} className={styles.spaceBar} style={{ width: s }} title={`${s}px`} />)}</div>
        <div className={styles.radiusRow}>
          <span className={styles.radiusBox} style={{ borderRadius: 8 }}>8 버튼·입력</span>
          <span className={styles.radiusBox} style={{ borderRadius: 12 }}>12 카드</span>
          <span className={styles.radiusBox} style={{ borderRadius: 20 }}>20 시트·배너</span>
          <span className={styles.radiusBox} style={{ borderRadius: 999 }}>999 칩·배지</span>
        </div>
      </Section>

      <Section id="button" title="Button">
        <div className={styles.row}>
          <Button>구독 시작하기</Button>
          <Button variant="secondary">주기 변경</Button>
          <Button variant="ghost">건너뛰기</Button>
          <Button variant="danger">해지</Button>
        </div>
        <div className={styles.row}>
          <Button size="sm">작게</Button>
          <Button size="md">보통</Button>
          <Button size="lg">크게</Button>
          <Button leadingIcon={<ShoppingCart />}>담기</Button>
          <Button loading>저장 중</Button>
          <Button disabled>비활성</Button>
          <Button href="/products" variant="secondary">링크 버튼</Button>
        </div>
        <div className={styles.row}><Button fullWidth>가로 꽉 채우기</Button></div>
      </Section>

      <Section id="iconbutton" title="IconButton">
        <div className={styles.row}>
          <IconButton aria-label="알림"><Bell /></IconButton>
          <IconButton aria-label="검색" variant="outline"><Search /></IconButton>
          <IconButton aria-label="테마" active><Sun /></IconButton>
          <IconButton aria-label="장바구니" size="sm"><ShoppingCart /></IconButton>
          <IconButton aria-label="비활성" disabled><Box /></IconButton>
        </div>
      </Section>

      <Section id="input" title="Input · Select">
        <div className={styles.grid2}>
          <Input label="이메일" placeholder="you@example.com" leading={<Mail />} helper="로그인에 사용됩니다." />
          <Input label="비밀번호" type="password" error="비밀번호는 8자 이상이어야 합니다." defaultValue="short" />
          <Input label="검색" placeholder="무엇을 정기적으로 받아볼까요?" leading={<Search />} />
          <Input label="비활성" disabled defaultValue="수정 불가" />
          <Select label="배송 주기" defaultValue="28">
            <option value="14">2주</option><option value="28">4주 (추천)</option><option value="42">6주</option><option value="56">8주</option>
          </Select>
          <Select label="오류 상태" error="선택이 필요합니다."><option>선택</option></Select>
        </div>
      </Section>

      <Section id="chip" title="Chip">
        <div className={styles.row}>
          {["세제", "화장지", "생수", "커피", "주방", "반려용품"].map((c) => (
            <Chip key={c} selected={chip === c} onClick={() => setChip(c)}>{c}</Chip>
          ))}
        </div>
        <div className={styles.row}>
          <Chip size="sm" selected>2주</Chip><Chip size="sm">4주</Chip><Chip size="sm" disabled>직접 입력</Chip>
          <Chip href="/products?category=WATER" icon={<Box />}>링크 칩</Chip>
        </div>
      </Section>

      <Section id="badge" title="Badge">
        <div className={styles.row}>
          {STATUSES.map((s) => <Badge key={s} status={s}>{s === "neutral" ? "기본" : s === "accent" ? "첫 구독 10%" : undefined}</Badge>)}
        </div>
      </Section>

      <Section id="card" title="Card">
        <div className={styles.grid3}>
          <Card padding="sm"><strong>작은 여백</strong><p>padding=sm</p></Card>
          <Card><strong>기본</strong><p>padding=md</p></Card>
          <Card padding="lg" interactive><strong>상호작용 카드</strong><p>hover 시 테두리 강조</p></Card>
        </div>
      </Section>

      <Section id="stepper" title="Stepper">
        <div className={styles.row}>
          <Stepper value={qty} onChange={setQty} aria-label="수량" />
          <Stepper value={qty} onChange={setQty} size="sm" aria-label="수량(작게)" max={5} />
          <Stepper value={1} onChange={() => {}} aria-label="비활성" disabled />
          <span>값: {qty}</span>
        </div>
      </Section>

      <Section id="dialog" title="Dialog">
        <Button variant="secondary" onClick={() => setOpen(true)}>구독 설정 열기</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="구독 설정"
          description="수량과 배송 주기를 정하면 다음 결제일이 계산됩니다."
          footer={<><Button variant="ghost" onClick={() => setOpen(false)}>취소</Button><Button onClick={() => { setOpen(false); toast.success("구독을 시작했어요."); }}>구독 시작하기</Button></>}
        >
          <div className={styles.grid2}>
            <Input label="첫 배송일" type="date" defaultValue="2026-09-15" />
            <Select label="배송 주기" defaultValue="28"><option value="14">2주</option><option value="28">4주</option></Select>
          </div>
          <p className={styles.help}>모바일에서는 아래에서 올라오는 시트, 태블릿 이상에서는 가운데 모달로 보입니다.</p>
        </Dialog>
      </Section>

      <Section id="toast" title="Toast">
        <div className={styles.row}>
          <Button variant="secondary" onClick={() => toast.success("건너뛰기가 적용됐어요. 다음 결제일이 10/03로 바뀌었습니다.")}>성공</Button>
          <Button variant="secondary" onClick={() => toast.error("카드 승인에 실패했어요. 내일 09:00에 다시 시도합니다.")}>오류</Button>
          <Button variant="secondary" onClick={() => toast.info("결제 하루 전에 알림을 보내드려요.")}>안내</Button>
        </div>
      </Section>

      <Section id="skeleton" title="Skeleton">
        <div className={styles.row}>
          <Skeleton variant="circle" width={40} height={40} />
          <Skeleton variant="text" width={160} />
          <Skeleton variant="rect" width={200} height={120} />
        </div>
      </Section>

      <Section id="empty" title="EmptyState">
        <Card padding="none">
          <EmptyState icon={<ShoppingCart />} title="장바구니가 비어 있어요" description="상품을 담고 배송 주기를 정하면 정기배송이 시작됩니다." action={<Button href="/products">상품 보러 가기</Button>} />
        </Card>
      </Section>
    </div>
  );
}
