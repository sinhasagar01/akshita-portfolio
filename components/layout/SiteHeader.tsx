import Link from "next/link";
import Container from "./Container";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-[--color-background]">
      <Container>
        <nav className="flex items-center justify-between py-5">
          <Link
            href="/"
            className="font-display italic text-xl text-[--color-text-primary] hover:text-[--color-accent] transition-colors duration-[--duration-base]"
          >
            Akshita
          </Link>
          <ul className="flex gap-8 list-none m-0 p-0">
            <li>
              <Link
                href="/#work"
                className="nav-link text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors duration-[--duration-base]"
              >
                Work
              </Link>
            </li>
            <li>
              <Link
                href="/#about"
                className="nav-link text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors duration-[--duration-base]"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/#contact"
                className="nav-link text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors duration-[--duration-base]"
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      </Container>
    </header>
  );
}
