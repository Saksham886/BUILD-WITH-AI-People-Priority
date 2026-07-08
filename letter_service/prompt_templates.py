from collections import Counter
from datetime import datetime

from department_lookup import DepartmentInfo
from models import AggregatedDetail, MasterIncident


def build_system_prompt() -> str:
    return (
        "You are an expert Indian government correspondence drafter writing on behalf of a Member of Parliament's office. "
        "Write ONLY in formal, bureaucratic English register appropriate for official Indian government correspondence. "
        "Do not use casual phrasing, slang, contractions, or explanatory commentary. "
        "Follow this exact structural skeleton, in order:\n\n"
        "1. Header block: 'OFFICE OF THE MEMBER OF PARLIAMENT' + constituency placeholder\n"
        "2. Date line\n"
        "3. Recipient address block (department title + name, provided to you - never invent this)\n"
        "4. Subject line (one bolded, capitalized line summarizing the issue)\n"
        "5. Salutation ('Dear Sir/Madam,')\n"
        "6. Opening paragraph: states the total complaint count and the core issue, giving it political weight\n"
        "7. Evidence section: a bulleted list, one bullet per aggregated detail, each showing the summary and its location\n"
        "8. Closing paragraph: names the specific ask (field inspection, repair, timeline - default to 48 hours if no timeline is given) and requests a formal action-taken report\n"
        "9. Sign-off block: 'Sincerely,' + MP name placeholder + constituency placeholder\n\n"
        "Critical constraints: never fabricate facts, dates, names, or incidents not present in the supplied data. "
        "If the input is missing a detail, use a clearly bracketed placeholder like [Member of Parliament] rather than inventing one. "
        "Output ONLY the Markdown letter text, with no preamble, no explanation, no code fences. "
        "Target length is 250-400 words and the output should fit on one printed page."
    )


def _format_date(now: datetime) -> str:
    return now.strftime("%d %B %Y")


def _count_urgencies(details: list[AggregatedDetail]) -> str:
    counts = Counter(detail.urgency.value for detail in details)
    parts = []
    for label in ("High", "Medium", "Low"):
        count = counts.get(label, 0)
        if count:
            suffix = "report" if count == 1 else "reports"
            parts.append(f"{count} {label} priority {suffix}")
    return ", ".join(parts) if parts else "No urgency breakdown available"


def _sort_and_truncate_details(details: list[AggregatedDetail]) -> tuple[list[AggregatedDetail], str | None]:
    if len(details) <= 10:
        return details, None

    priority = {"High": 0, "Medium": 1, "Low": 2}
    ordered = sorted(enumerate(details), key=lambda item: (priority.get(item[1].urgency.value, 99), item[0]))
    top_details = [item[1] for item in ordered[:10]]
    remaining = len(details) - 10
    return top_details, f"...and {remaining} additional similar reports on file."


def _build_bullets(details: list[AggregatedDetail], closing_note: str | None) -> str:
    if not details:
        return "NONE"

    bullets = [f"- {detail.summary} (Location: {detail.location})" for detail in details]
    if closing_note:
        bullets.append(closing_note)
    return "\n".join(bullets)


def build_user_prompt(incident: MasterIncident, department: DepartmentInfo) -> str:
    now = datetime.now()
    urgency_breakdown = _count_urgencies(incident.aggregated_details)
    details, closing_note = _sort_and_truncate_details(incident.aggregated_details)
    bullet_block = _build_bullets(details, closing_note)

    empty_evidence_instruction = ""
    if bullet_block == "NONE":
        empty_evidence_instruction = (
            "No aggregated detail bullets are available. Write a generic opening paragraph based only on the title and total complaint count, "
            "and omit the evidence section entirely."
        )

    return (
        f"Today's date: {_format_date(now)}\n"
        f"Department title: {department.title}\n"
        f"Department address line: {department.address_line}\n"
        f"Incident title: {incident.title}\n"
        f"Incident category: {incident.category}\n"
        f"Total complaints count: {incident.total_complaints_count}\n"
        f"Urgency breakdown: {urgency_breakdown}\n"
        f"Evidence bullets:\n{bullet_block}\n"
        f"Instruction: {empty_evidence_instruction or 'Draft the formal letter using the supplied facts and the exact structure required in the system prompt.'}"
    )
