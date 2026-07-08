from dataclasses import dataclass


@dataclass(frozen=True)
class DepartmentInfo:
    title: str
    department_name: str
    address_line: str


DEPARTMENT_LOOKUP: dict[str, DepartmentInfo] = {
    "water supply": DepartmentInfo(
        title="The Chief Engineer, Jal Board",
        department_name="Jal Board",
        address_line="Jal Board Headquarters, Government of the NCT of Delhi",
    ),
    "roads & infrastructure": DepartmentInfo(
        title="The Executive Engineer, Public Works Department",
        department_name="Public Works Department",
        address_line="Public Works Department, Government Secretariat",
    ),
    "electricity": DepartmentInfo(
        title="The Superintending Engineer, State Electricity Board",
        department_name="State Electricity Board",
        address_line="State Electricity Board, Main Administrative Office",
    ),
    "sanitation & waste": DepartmentInfo(
        title="The Health Officer, Municipal Corporation",
        department_name="Municipal Corporation",
        address_line="Municipal Corporation Head Office",
    ),
    "public health": DepartmentInfo(
        title="The Chief Medical Officer",
        department_name="Health Department",
        address_line="Office of the Chief Medical Officer",
    ),
    "education": DepartmentInfo(
        title="The District Education Officer",
        department_name="Education Department",
        address_line="District Education Office",
    ),
    "public safety": DepartmentInfo(
        title="The Superintendent of Police",
        department_name="Police Department",
        address_line="Office of the Superintendent of Police",
    ),
}

FALLBACK_DEPARTMENT = DepartmentInfo(
    title="The District Collector / Concerned Administrative Authority",
    department_name="District Administration",
    address_line="Office of the District Collector",
)


def _normalize(value: str) -> str:
    return " ".join(value.strip().lower().replace("/", " ").replace("-", " ").split())


def resolve_department(category: str) -> DepartmentInfo:
    normalized = _normalize(category)
    for key, department in DEPARTMENT_LOOKUP.items():
        if _normalize(key) == normalized:
            return department
    return FALLBACK_DEPARTMENT
