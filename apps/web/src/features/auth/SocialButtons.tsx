import { socialLoginUrl } from "./api";
import styles from "./AuthForm.module.scss";

export function SocialButtons() {
  return (
    <div className={styles.social}>
      <a className={styles.kakao} href={socialLoginUrl("kakao")}>카카오로 계속하기</a>
      <a className={styles.google} href={socialLoginUrl("google")}>Google로 계속하기</a>
    </div>
  );
}
