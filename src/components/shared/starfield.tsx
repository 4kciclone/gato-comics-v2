import styles from './starfield.module.scss';

export function Starfield() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden opacity-50">
      <div className={styles.stars} />
      <div className={styles.stars2} />
      <div className={styles.stars3} />
    </div>
  );
}