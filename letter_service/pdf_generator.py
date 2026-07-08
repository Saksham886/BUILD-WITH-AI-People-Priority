import re
import unicodedata
from typing import Iterable

from fpdf import FPDF

from letterhead_config import LETTERHEAD_CONFIG


def sanitize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_text = ascii_text.replace("\u2013", "-").replace("\u2014", "-")
    ascii_text = ascii_text.replace("\u2022", "-")
    ascii_text = re.sub(
        r"(\S{40,})",
        lambda match: "\n".join(match.group(1)[i : i + 40] for i in range(0, len(match.group(1)), 40)),
        ascii_text,
    )
    return ascii_text


def _strip_markdown(value: str) -> str:
    value = value.strip()
    value = re.sub(r"\*\*(.*?)\*\*", r"\1", value)
    value = re.sub(r"__(.*?)__", r"\1", value)
    return value


def _parse_markdown_blocks(markdown_text: str) -> list[tuple[str, list[str]]]:
    blocks: list[tuple[str, list[str]]] = []
    current_paragraph: list[str] = []
    current_bullets: list[str] = []

    def flush_paragraph() -> None:
        nonlocal current_paragraph
        if current_paragraph:
            blocks.append(("paragraph", [" ".join(current_paragraph).strip()]))
            current_paragraph = []

    def flush_bullets() -> None:
        nonlocal current_bullets
        if current_bullets:
            blocks.append(("bullets", current_bullets))
            current_bullets = []

    for raw_line in markdown_text.splitlines():
        line = raw_line.strip()
        if not line:
            flush_paragraph()
            flush_bullets()
            continue
        if line.startswith("-") or line.startswith("*"):
            flush_paragraph()
            current_bullets.append(_strip_markdown(line[1:].strip()))
            continue
        flush_bullets()
        current_paragraph.append(_strip_markdown(line))

    flush_paragraph()
    flush_bullets()
    return blocks


class LetterPDF(FPDF):
    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Times", "I", LETTERHEAD_CONFIG["footer_font_size"])
        self.cell(0, 8, f"Page {self.page_no()}/{{nb}}", align="C")


def _add_letterhead(pdf: FPDF, constituency_name: str, mp_name: str) -> None:
    pdf.set_font("Times", "B", 16)
    pdf.cell(0, 8, LETTERHEAD_CONFIG["office_name"], ln=1, align="C")
    pdf.set_font("Times", "", 11)
    pdf.cell(0, 6, sanitize_text(constituency_name), ln=1, align="C")
    pdf.ln(2)
    # Insert MP office logo or emblem here in a future iteration.
    pdf.set_font("Times", "I", 9)
    pdf.cell(0, 5, LETTERHEAD_CONFIG["logo_placeholder_note"], ln=1, align="C")
    pdf.ln(4)


def _write_wrapped(pdf: FPDF, text: str, font_style: str = "", font_size: int = 12, indent_mm: float = 0) -> None:
    pdf.set_font("Times", font_style, font_size)
    left = pdf.l_margin + indent_mm
    right = pdf.r_margin
    width = pdf.w - left - right
    pdf.set_x(left)
    pdf.multi_cell(width, 6, sanitize_text(text), align="J")


def _write_bullets(pdf: FPDF, bullets: Iterable[str]) -> None:
    pdf.set_font("Times", "", 12)
    for bullet in bullets:
        pdf.set_x(pdf.l_margin + 5)
        pdf.multi_cell(pdf.w - pdf.l_margin - pdf.r_margin - 5, 6, f"- {sanitize_text(bullet)}", align="J")


def generate_pdf_bytes(letter_markdown: str, constituency_name: str, mp_name: str) -> bytes:
    pdf = LetterPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=25)
    pdf.alias_nb_pages()
    pdf.set_margins(LETTERHEAD_CONFIG["margin_mm"], LETTERHEAD_CONFIG["margin_mm"], LETTERHEAD_CONFIG["margin_mm"])
    pdf.add_page()
    _add_letterhead(pdf, constituency_name, mp_name)

    blocks = _parse_markdown_blocks(letter_markdown)
    for block_type, items in blocks:
        if block_type == "bullets":
            _write_bullets(pdf, items)
            pdf.ln(1)
            continue

        text = items[0]
        if text.startswith("#"):
            text = text.lstrip("#").strip()
            pdf.set_font("Times", "B", 13)
            pdf.multi_cell(0, 7, sanitize_text(text), align="L")
        elif text.upper() == text and len(text) > 10:
            pdf.set_font("Times", "B", 12)
            pdf.multi_cell(0, 6, sanitize_text(text), align="L")
        else:
            _write_wrapped(pdf, text)
        pdf.ln(1)

    pdf.ln(LETTERHEAD_CONFIG["signature_gap_mm"])
    pdf.set_font("Times", "", 12)
    pdf.cell(0, 6, "______________________________", ln=1, align="R")
    pdf.cell(0, 6, sanitize_text(mp_name), ln=1, align="R")
    pdf.cell(0, 6, sanitize_text(constituency_name), ln=1, align="R")

    output = pdf.output(dest="S")
    if isinstance(output, str):
        return output.encode("latin-1")
    return bytes(output)
