import Container from "./Container";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[--color-border] py-12">
      <Container>
        <p className="text-sm text-[--color-text-muted]">
          Akshita <span aria-hidden="true">·</span> Product Designer
        </p>
      </Container>
    </footer>
  );
}
