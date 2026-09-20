/** 구독가: 정가에서 할인율(%)을 적용하고 10원 단위로 내림 */
export function subscriptionUnitPrice(price: number, discountPercent: number): number {
  return Math.floor((price * (100 - discountPercent)) / 100 / 10) * 10;
}

/** 회당 결제 금액 = 구독가 × 수량 */
export function subscriptionAmount(price: number, discountPercent: number, quantity: number): number {
  return subscriptionUnitPrice(price, discountPercent) * quantity;
}

export function formatKrw(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
