import styles from '../Header/header.module.scss';
import Link from 'next/link';

export default function Header() {
  // TODO
  return (
    <div className={styles.header}>
      <Link href="/" >
        <img src="/spacetraveling.svg" alt="logo" />
      </Link>
    </div>
  )
}
